export const STATES = [
  { slug: "nsw", code: "l3008839", name: "New South Wales" },
  { slug: "vic", code: "l3008844", name: "Victoria" },
  { slug: "qld", code: "l3008841", name: "Queensland" },
  { slug: "wa", code: "l3008845", name: "Western Australia" },
  { slug: "sa", code: "l3008842", name: "South Australia" },
];

export const KEYWORDS = [
  "need+plumber",
  "need+electrician",
  "need+painter",
  "need+cleaner",
  "need+landscaper",
  "need+handyman",
  "need+tiler",
  "looking+for+tradesman",
  "need+quote+renovation",
  "help+needed+home",
];

export function buildUrls() {
  const urls = [];
  for (const state of STATES) {
    for (const keyword of KEYWORDS) {
      urls.push({
        url: `https://www.gumtree.com.au/s-${state.slug}/${keyword}/k0${state.code}?sort=date`,
        state: state.slug,
        keyword,
      });
    }
  }
  return urls;
}

export const LIMITS = {
  maxItemsPerRun: 300,
  maxMatchesPerLead: 3,
  leadExpiryDays: 7,
  pageTimeoutMs: 30000,
  runTimeoutMs: 600000,
};
