// test-selectors.js
import "dotenv/config";
import * as cheerio from "cheerio";

const key = process.env.ZYTE_API_KEY;
const auth = Buffer.from(key + ":").toString("base64");

console.log("Fetching Gumtree page via Zyte...");

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

// Check which selectors exist on the page
console.log(
  'data-q="search-result" count:  ',
  $('[data-q="search-result"]').length,
);
console.log(
  'data-q="listing-title" count:  ',
  $('[data-q="listing-title"]').length,
);
console.log('a[href*="/s-ad/"] count:        ', $('a[href*="/s-ad/"]').length);

// Print first 3 titles found
console.log("\nFirst 3 listing titles:");
$('[data-q="listing-title"]')
  .slice(0, 3)
  .each((i, el) => {
    console.log(`  ${i + 1}. ${$(el).text().trim()}`);
  });

// Print first 3 links found
console.log("\nFirst 3 s-ad links:");
$('a[href*="/s-ad/"]')
  .slice(0, 3)
  .each((i, el) => {
    console.log(`  ${i + 1}. ${$(el).attr("href")}`);
  });

// If nothing found, show what data-q values DO exist
if ($('[data-q="search-result"]').length === 0) {
  console.log("\nNo search-results found. data-q values on page:");
  const dataQValues = new Set();
  $("[data-q]").each((_, el) => dataQValues.add($(el).attr("data-q")));
  console.log([...dataQValues].slice(0, 20));
}
