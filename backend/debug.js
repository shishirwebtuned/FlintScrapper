// debug.js
import "dotenv/config";
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: false }); // headless: false so you can SEE the browser
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
  });

  const page = await context.newPage();

  const url =
    "https://www.gumtree.com.au/s-nsw/need+plumber/k0l3008839?sort=date";
  console.log("Navigating to:", url);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait a moment for JS to render
  await page.waitForTimeout(3000);

  // Save the full HTML so we can inspect it
  const html = await page.content();

  // Log the page title so we know what loaded
  const title = await page.title();
  console.log("Page title:", title);

  // Try to find ANY listing elements and log what's there
  const bodyText = await page.evaluate(() =>
    document.body.innerText.slice(0, 500),
  );
  console.log("Body text preview:\n", bodyText);

  // Check what data-q attributes actually exist on the page
  const dataQElements = await page.evaluate(() => {
    const els = document.querySelectorAll("[data-q]");
    return [...new Set([...els].map((el) => el.getAttribute("data-q")))].slice(
      0,
      30,
    );
  });
  console.log("\ndata-q attributes found on page:", dataQElements);

  // Save HTML to file so you can inspect it
  import("fs").then((fs) => {
    fs.writeFileSync("gumtree_debug.html", html);
    console.log("\nFull HTML saved to gumtree_debug.html");
  });

  await page.waitForTimeout(5000); // Keep browser open for 5s so you can see it
  await browser.close();
})();
