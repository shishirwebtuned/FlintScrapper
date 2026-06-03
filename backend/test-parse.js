// test-parse.js
import "dotenv/config";
import * as cheerio from "cheerio";

const key = process.env.ZYTE_API_KEY;
const auth = Buffer.from(key + ":").toString("base64");

console.log("Fetching page...");

const res = await fetch("https://api.zyte.com/v1/extract", {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://www.gumtree.com.au/s-nsw/need+plumber/k0l3008839?sort=date",
    browserHtml: true,
  }),
});

const data = await res.json();
const $ = cheerio.load(data.browserHtml);
const listings = [];

$('a[href*="/s-ad/"]').each((_, el) => {
  const href = $(el).attr("href") || "";
  const ariaLabel = $(el).attr("aria-label") || "";
  const linkText = $(el).text().trim();

  const idMatch = href.match(/\/(\d{8,12})$/);
  if (!idMatch || !ariaLabel) return;

  const title = ariaLabel
    .split(/\n|Price:/)[0]
    .replace(/\.$/, "")
    .trim();
  if (!title || title.length < 5) return;

  const locationMatch = ariaLabel.match(/Location:\s*([^.]+)/);
  const location = locationMatch ? locationMatch[1].trim() : "";

  const description =
    linkText.length > title.length ? linkText.slice(title.length).trim() : "";

  if (listings.find((l) => l.sourceId === idMatch[1])) return;

  listings.push({
    title,
    sourceId: idMatch[1],
    location,
    description: description.slice(0, 80),
  });
});

console.log(`\nFound ${listings.length} listings:\n`);
listings.forEach((l, i) => {
  console.log(`${i + 1}. ${l.title}`);
  console.log(`   Location: ${l.location}`);
  console.log(`   Desc: ${l.description}`);
  console.log(`   ID: ${l.sourceId}\n`);
});
