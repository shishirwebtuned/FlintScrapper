// index.js

import "dotenv/config";
import * as cheerio from "cheerio";
import { buildUrls, LIMITS } from "./config.js";
import { preFilter } from "./scraper/prefilter.js";
import { classifyListing } from "./scraper/classifier.js";
import {
  geocode,
  clearGeoCache,
  extractPostcode,
  extractSuburb,
  extractState,
} from "./scraper/geocoder.js";
import {
  getSupabase,
  saveLead,
  matchLead,
  startRun,
  finishRun,
  notifyTradies,
} from "./scraper/db.js";

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { newPage, closeBrowser } from "./scraper/browser.js";

// chromium.use(StealthPlugin());

// ------------------------------------------------------------------
// PART 1 — Scrape a single Gumtree search results page
// Returns array of raw listing objects
// ------------------------------------------------------------------

async function scrapeSearchPage(url, state) {
  try {
    const key = process.env.ZYTE_API_KEY;
    const auth = Buffer.from(key + ":").toString("base64");

    console.log(`[scraper] Fetching via Zyte...`);

    const response = await fetch("https://api.zyte.com/v1/extract", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, browserHtml: true }),
      signal: AbortSignal.timeout(90000),
    });

    const data = await response.json();

    if (!data.browserHtml) {
      console.error("[scraper] Zyte returned no HTML:", JSON.stringify(data));
      return [];
    }

    const $ = cheerio.load(data.browserHtml);
    const listings = [];

    $('a[href*="/s-ad/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const ariaLabel = $(el).attr("aria-label") || "";
      const linkText = $(el).text().trim();

      // Extract listing ID from URL
      // Format: /s-ad/suburb/category/title/1234567890
      const idMatch = href.match(/\/(\d{8,12})$/);
      if (!idMatch) return;

      // Skip if no aria-label (not a real listing card)
      if (!ariaLabel) return;

      // --- Parse aria-label ---
      // Format: "Title.\n Price: $XX .\n Location: Region, Suburb. Ad listed X ago."

      // Title = everything before the first newline or "Price:"
      const title = ariaLabel
        .split(/\n|Price:/)[0]
        .replace(/\.$/, "")
        .trim();

      if (!title || title.length < 5) return;

      // Location = extract from "Location: X, Y."
      const locationMatch = ariaLabel.match(/Location:\s*([^.]+)/);
      const location = locationMatch ? locationMatch[1].trim() : "";

      // Price = extract from "Price: $XX"
      const priceMatch = ariaLabel.match(/Price:\s*([^.]+)/);
      const priceText = priceMatch
        ? priceMatch[1].replace("not listed", "").trim()
        : "";

      // Description = the link text minus the title (Gumtree appends snippet)
      const description =
        linkText.length > title.length
          ? linkText.slice(title.length).trim()
          : "";

      // Avoid duplicates within this page
      if (listings.find((l) => l.sourceId === idMatch[1])) return;

      listings.push({
        title,
        url: `https://www.gumtree.com.au${href}`,
        sourceId: idMatch[1],
        location,
        description,
        priceText,
      });
    });

    console.log(`[scraper] Parsed ${listings.length} listings`);
    return listings;
  } catch (err) {
    console.error(`[scraper] scrapeSearchPage error:`, err.message);
    return [];
  }
}

// ------------------------------------------------------------------
// PART 2 — Process a single listing through the full pipeline
// prefilter → classify → geocode → save → match
// ------------------------------------------------------------------
async function processListing(listing, state, stats) {
  // Step 1 — Pre-filter (free, no API call)
  const filterResult = preFilter(listing.title, listing.description);
  if (!filterResult.pass) {
    stats.itemsFiltered++;
    return;
  }

  // Step 2 — Extract location info from listing
  const rawLocationText = `${listing.title} ${listing.description} ${listing.location}`;
  const postcode = extractPostcode(rawLocationText);
  const suburb =
    extractSuburb(listing.location) || extractSuburb(listing.title);
  const listingState = extractState(listing.location) || state.toUpperCase();

  // Step 3 — Claude classification (costs tokens)
  const classification = await classifyListing({
    title: listing.title,
    description: listing.description,
    suburb,
    state: listingState,
  });

  stats.itemsClassified++;
  stats.aiCalls++;
  stats.aiTokensUsed += classification.tokens || 0;

  // Skip if Claude says it's not a real job request
  if (!classification.success || !classification.data.is_job_request) {
    return;
  }

  // Step 4 — Geocode
  const geo = await geocode({ postcode, suburb, state: listingState });

  // Step 5 — Save to Supabase
  const saved = await saveLead({
    sourceId: listing.sourceId,
    sourceUrl: listing.url,
    rawTitle: listing.title,
    rawText: listing.description,
    classification: classification.data,
    postcode: geo?.postcode || postcode,
    suburb: geo?.suburb || suburb,
    state: geo?.state || listingState,
    latitude: geo?.latitude || null,
    longitude: geo?.longitude || null,
  });

  if (!saved) {
    // null means duplicate — already in DB
    stats.leadsDuped++;
    return;
  }

  stats.leadsCreated++;

  // Step 6 — Run matching RPC to find tradies for this lead
  if (saved.location) {
    await matchLead(saved.id);
    await notifyTradies(saved.id);
  }
}

// ------------------------------------------------------------------
// PART 3 — Main run function
// Loops through all 50 URLs, processes listings, logs stats
// ------------------------------------------------------------------
async function run() {
  console.log("[flint] Starting scraper run...");

  const runId = await startRun();
  const urls = buildUrls();

  const stats = {
    urlsScraped: 0,
    itemsSeen: 0,
    itemsFiltered: 0,
    itemsClassified: 0,
    leadsCreated: 0,
    leadsDuped: 0,
    aiCalls: 0,
    aiTokensUsed: 0,
    status: "completed",
    errors: [],
  };

  try {
    for (const { url, state, keyword } of urls) {
      // Hard cap — stop processing if limit reached
      if (stats.itemsSeen >= LIMITS.maxItemsPerRun) {
        console.log(
          `[flint] Hit maxItemsPerRun limit (${LIMITS.maxItemsPerRun}), stopping early`,
        );
        break;
      }

      console.log(`[scraper] Scraping: ${keyword} / ${state}`);

      // Scrape the search results page
      const listings = await scrapeSearchPage(url, state);
      stats.urlsScraped++;
      stats.itemsSeen += listings.length;

      console.log(`[scraper] Found ${listings.length} listings`);

      // Process each listing through the pipeline
      for (const listing of listings) {
        if (stats.itemsSeen >= LIMITS.maxItemsPerRun) break;

        try {
          await processListing(listing, state, stats);
        } catch (err) {
          // One bad listing never stops the run
          stats.errors.push({
            url: listing.url,
            error: err.message,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Small delay between pages — be respectful to Gumtree
      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch (err) {
    console.error("[flint] Run failed:", err.message);
    stats.status = "failed";
    stats.errors.push({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Always clean up, always log — even if the run crashed
    // await closeBrowser();
    clearGeoCache();
    await finishRun(runId, stats);

    console.log(`[flint] Run complete:
      URLs scraped:      ${stats.urlsScraped}
      Items seen:        ${stats.itemsSeen}
      Filtered out:      ${stats.itemsFiltered}
      Sent to Claude:    ${stats.itemsClassified}
      Leads created:     ${stats.leadsCreated}
      Duplicates:        ${stats.leadsDuped}
      AI calls:          ${stats.aiCalls}
      Tokens used:       ${stats.aiTokensUsed}
      Status:            ${stats.status}
    `);
  }
}

// ------------------------------------------------------------------
// PART 4 — Entry point with hard timeout
// Wraps the entire run in a 10-minute safety net
// ------------------------------------------------------------------
Promise.race([
  run(),
  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Run exceeded 10 minute timeout")),
      LIMITS.runTimeoutMs,
    ),
  ),
]).catch(async (err) => {
  console.error("[flint] Fatal error or timeout:", err.message);
  await closeBrowser();
  clearGeoCache();
  process.exit(1);
});
