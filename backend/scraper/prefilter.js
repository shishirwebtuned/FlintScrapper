// scraper/prefilter.js

// ------------------------------------------------------------------
// PART 1 — Job signal words
// If a title contains ANY of these, it passes the filter immediately,
// even if it also matches a junk pattern below.
// These indicate a real customer looking for work to be done.
// ------------------------------------------------------------------
const JOB_SIGNALS = [
  "wanted",
  "need",
  "needed",
  "looking for",
  "seeking",
  "require",
  "required",
  "help with",
  "anyone recommend",
  "can anyone",
  "who can",
  "quote",
  "quotes",
  "price for",
  "cost of",
  "how much",
];

// ------------------------------------------------------------------
// PART 2 — Hard junk patterns
// These catch tradie ads, product sales, and spam listings.
// Only applied if NO job signal is found.
// ------------------------------------------------------------------
const JUNK_PATTERNS = [
  // Tradie self-promotion
  /free quote/i,
  /call us/i,
  /call now/i,
  /24\/7/i,
  /fully licen[sc]ed/i,
  /\d+\s*years?\s*(of\s*)?experience/i,
  /family owned/i,
  /locally owned/i,
  /no call out fee/i,
  /satisfaction guaranteed/i,
  /competitive rates/i,
  /best price/i,
  /affordable/i,

  // Business identifiers
  /pty\.?\s*ltd/i,
  /p\/l/i,
  /trading as/i,

  // Product sales
  /for sale/i,
  /selling/i,
  /brand new/i,
  /second hand/i,
  /used\s+(pump|motor|panel|unit|system)/i,
  /ex[\s-]display/i,

  // Recruitment / job ads
  /apprentice\s+wanted/i,
  /looking for work/i,
  /available for work/i,
  /seeking work/i,
  /seeking employment/i,
  /apply now/i,
  /join our team/i,
  /subcontractors? wanted/i,

  // Sponsored / top listing markers
  /^top /i,
  /sponsored/i,
  /featured/i,

  // Real estate bleed-through
  /for lease/i,
  /for rent/i,
  /property management/i,
  /strata/i,
  /body corporate/i,
];

// ------------------------------------------------------------------
// PART 3 — Minimum description length
// Listings with fewer than this many characters in the description
// are almost always spam or auto-generated ads. Skip them.
// ------------------------------------------------------------------
const MIN_DESCRIPTION_LENGTH = 30;

// ------------------------------------------------------------------
// Main export — run this on every listing before calling Claude
// ------------------------------------------------------------------
export function preFilter(title = "", description = "") {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  // Rule 1 — Job signal in title = always pass, no further checks
  const hasJobSignal = JOB_SIGNALS.some((signal) =>
    titleLower.includes(signal),
  );
  if (hasJobSignal) {
    return { pass: true, reason: "job_signal" };
  }

  // Rule 2 — Description too short = skip
  if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
    return { pass: false, reason: "description_too_short" };
  }

  // Rule 3 — Matches a junk pattern = skip
  const matchedJunk = JUNK_PATTERNS.find((pattern) => pattern.test(combined));
  if (matchedJunk) {
    return { pass: false, reason: `junk_pattern: ${matchedJunk}` };
  }

  // Rule 4 — Job signal in description (secondary check)
  const hasSignalInDesc = JOB_SIGNALS.some((signal) =>
    descLower.includes(signal),
  );
  if (hasSignalInDesc) {
    return { pass: true, reason: "job_signal_in_description" };
  }

  // Rule 5 — Default: skip anything with no clear signal
  return { pass: false, reason: "no_job_signal_found" };
}
