// scraper/geocoder.js

import { getSupabase } from "./db.js";

// ------------------------------------------------------------------
// PART 1 — In-memory cache
// Postcodes don't change. Cache every lookup so the same postcode
// is never queried twice in the same scraper run.
// ------------------------------------------------------------------
const cache = new Map();

// ------------------------------------------------------------------
// PART 2 — Extract postcode from raw text
// Gumtree listings don't have a clean postcode field.
// This pulls the first 4-digit Australian postcode found in the
// title, description, or suburb string.
// ------------------------------------------------------------------
export function extractPostcode(text = "") {
  // Australian postcodes are always exactly 4 digits
  // and start with 2, 3, 4, 5, 6, 7, or 8
  const match = text.match(/\b([2-8]\d{3})\b/);
  return match ? match[1] : null;
}

// ------------------------------------------------------------------
// PART 3 — Extract suburb from Gumtree listing location string
// Gumtree shows location as "Suburb, STATE 1234"
// e.g. "Parramatta, NSW 2150" or "Richmond, VIC 3121"
// ------------------------------------------------------------------
export function extractSuburb(locationText = "") {
  // Split on comma, take the first part
  const parts = locationText.split(",");
  return parts[0]?.trim() || null;
}

// ------------------------------------------------------------------
// PART 4 — Extract state from Gumtree listing location string
// ------------------------------------------------------------------
export function extractState(locationText = "") {
  const stateMatch = locationText.match(/\b(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/i);
  return stateMatch ? stateMatch[1].toUpperCase() : null;
}

// ------------------------------------------------------------------
// PART 5 — Main geocode function
// Returns { latitude, longitude, suburb, state, postcode } or null
// ------------------------------------------------------------------
export async function geocode({ postcode, suburb, state, rawText = "" }) {
  // Try to extract postcode from raw text if not provided
  const resolvedPostcode = postcode || extractPostcode(rawText) || null;

  if (!resolvedPostcode) {
    return null; // Can't geocode without a postcode
  }

  // Check cache first
  if (cache.has(resolvedPostcode)) {
    return cache.get(resolvedPostcode);
  }

  try {
    const supabase = getSupabase();

    // Look up postcode in au_postcodes table
    // If suburb is known, match on both for precision
    // Otherwise just match on postcode and take the first result
    let query = supabase
      .from("au_postcodes")
      .select("postcode, suburb, state, latitude, longitude")
      .eq("postcode", resolvedPostcode)
      .limit(1);

    if (suburb) {
      query = query.ilike("suburb", `%${suburb}%`);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      // Fallback — try postcode alone without suburb filter
      const { data: fallback, error: fallbackError } = await supabase
        .from("au_postcodes")
        .select("postcode, suburb, state, latitude, longitude")
        .eq("postcode", resolvedPostcode)
        .limit(1)
        .single();

      if (fallbackError || !fallback) {
        console.warn(`[geocoder] No result for postcode ${resolvedPostcode}`);
        cache.set(resolvedPostcode, null);
        return null;
      }

      const result = {
        postcode: fallback.postcode,
        suburb: fallback.suburb,
        state: fallback.state,
        latitude: fallback.latitude,
        longitude: fallback.longitude,
      };

      cache.set(resolvedPostcode, result);
      return result;
    }

    const result = {
      postcode: data.postcode,
      suburb: data.suburb,
      state: data.state,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    // Cache for this run
    cache.set(resolvedPostcode, result);
    return result;
  } catch (err) {
    console.error("[geocoder] Error:", err.message);
    return null;
  }
}

// Call this at the end of each scraper run to free memory
export function clearGeoCache() {
  cache.clear();
}
