// test-html.js
import "dotenv/config";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";

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

// For each s-ad link, print the parent container HTML
// This shows us what surrounds each listing
console.log("\n=== LISTING CONTAINERS ===\n");
$('a[href*="/s-ad/"]')
  .slice(0, 3)
  .each((i, el) => {
    // Walk up the DOM to find the listing card container
    // Try parent, grandparent, great-grandparent
    const parent = $(el).parent();
    const grandparent = parent.parent();
    const greatgrandparent = grandparent.parent();

    console.log(`\n--- Link ${i + 1} ---`);
    console.log("href:", $(el).attr("href"));
    console.log("aria-label:", $(el).attr("aria-label"));
    console.log("link text:", $(el).text().trim().slice(0, 100));
    console.log(
      "parent tag+class:",
      parent.prop("tagName"),
      parent.attr("class")?.slice(0, 80),
    );
    console.log(
      "grandparent tag+class:",
      grandparent.prop("tagName"),
      grandparent.attr("class")?.slice(0, 80),
    );
    console.log(
      "greatgrandparent tag+class:",
      greatgrandparent.prop("tagName"),
      greatgrandparent.attr("class")?.slice(0, 80),
    );
    console.log(
      "grandparent text preview:",
      grandparent.text().trim().slice(0, 150),
    );
  });

// Save full HTML for manual inspection
writeFileSync("gumtree_live.html", data.browserHtml);
console.log(
  "\nFull HTML saved to gumtree_live.html — open in browser to inspect",
);
