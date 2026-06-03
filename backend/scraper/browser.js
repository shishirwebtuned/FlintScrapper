// import { chromium } from "playwright-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";

// chromium.use(StealthPlugin());

// let browserInstance = null;

// export async function getBrowser() {
//   if (browserInstance) return browserInstance;

//   browserInstance = await chromium.launch({
//     headless: true,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage", // Prevents crashes in Railway/Docker
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--single-process", // Required for Railway's container environment
//       "--disable-gpu",
//     ],
//   });

//   browserInstance.on("disconnected", () => {
//     console.log("[browser] Browser disconnected — resetting instance");
//     browserInstance = null;
//   });

//   return browserInstance;
// }

// export async function newPage() {
//   const browser = await getBrowser();
//   const context = await browser.newContext({
//     userAgent:
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
//       "AppleWebKit/537.36 (KHTML, like Gecko) " +
//       "Chrome/120.0.0.0 Safari/537.36",
//     viewport: { width: 1280, height: 800 },
//     locale: "en-AU",
//     timezoneId: "Australia/Sydney",
//     extraHTTPHeaders: {
//       "Accept-Language": "en-AU,en;q=0.9",
//     },
//   });

//   const page = await context.newPage();

//   // Block images, fonts, and media — speeds up scraping significantly
//   await page.route("**/*", (route) => {
//     const type = route.request().resourceType();
//     if (["image", "media", "font", "stylesheet"].includes(type)) {
//       route.abort();
//     } else {
//       route.continue();
//     }
//   });

//   return page;
// }

// export async function closeBrowser() {
//   if (browserInstance) {
//     await browserInstance.close();
//     browserInstance = null;
//   }
// }

// scraper/browser.js

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

let browserInstance = null;

// Detect if running in a Linux container (Railway) or Windows/Mac locally
const isLinux = process.platform === "linux";

export async function getBrowser() {
  if (browserInstance) return browserInstance;

  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--disable-gpu",
  ];

  // Only add --single-process on Linux (Railway)
  // On Windows it causes immediate crashes
  if (isLinux) {
    args.push("--no-zygote");
    args.push("--single-process");
  }

  browserInstance = await chromium.launch({
    headless: true,
    args,
  });

  browserInstance.on("disconnected", () => {
    console.log("[browser] Browser disconnected — resetting instance");
    browserInstance = null;
  });

  return browserInstance;
}

export async function newPage() {
  const browser = await getBrowser();

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    extraHTTPHeaders: {
      "Accept-Language": "en-AU,en;q=0.9",
    },
  });

  const page = await context.newPage();

  // Block images, fonts, media to speed up scraping
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "media", "font", "stylesheet"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  return page;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
