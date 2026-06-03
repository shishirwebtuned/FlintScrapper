// scraper/classifier.js

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ------------------------------------------------------------------
// PART 1 — System prompt
// Tells Claude exactly what to do and what to return.
// Keeping this tight reduces token usage and cost.
// ------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a lead classifier for Flint, an Australian tradie lead generation platform.

Your job is to analyse Gumtree listings and determine if they are genuine job requests from homeowners or businesses looking to hire a tradesperson.

You must return ONLY a valid JSON object — no explanation, no markdown, no preamble.

Classification rules:
- is_job_request: true only if a real customer is actively seeking a tradie to do work
- Return false for: tradie self-promotion, product sales, job/recruitment ads, real estate listings, spam
- When genuinely uncertain, return is_job_request: false
- trade_types must only contain values from this list: plumber, gasfitter, electrician, painter, cleaner, landscaper, handyman, tiler, builder, carpenter, roofer, concreter, plasterer, fencer, glazier, locksmith, pest_control, hvac, demolition, inspector
- urgency: emergency (needs it today/ASAP), this_week, this_month, planning (no rush), unknown
- job_scope: small_job (under $500), medium_job ($500-$5000), large_job (over $5000), ongoing
- score: 0-100 lead quality. High score = clear job request + urgency + budget mentioned + good description
- summary: 1-2 sentences max, written for a tradie to read quickly`;

// ------------------------------------------------------------------
// PART 2 — Build the user message for each listing
// ------------------------------------------------------------------
function buildPrompt(title, description, suburb, state) {
  return `Classify this Gumtree listing:

Title: ${title}
Location: ${suburb || "Unknown"}, ${state || "Unknown"}
Description: ${description?.slice(0, 1000) || "No description"}

Return this exact JSON structure:
{
  "is_job_request": boolean,
  "trade_types": string[],
  "urgency": "emergency" | "this_week" | "this_month" | "planning" | "unknown",
  "job_scope": "small_job" | "medium_job" | "large_job" | "ongoing" | null,
  "budget_min": number | null,
  "budget_max": number | null,
  "budget_text": string | null,
  "contact_name": string | null,
  "summary": string,
  "score": number,
  "score_breakdown": {
    "urgency_score": number,
    "budget_score": number,
    "description_quality": number,
    "trade_clarity": number
  }
}`;
}

// ------------------------------------------------------------------
// PART 3 — Main classify function
// ------------------------------------------------------------------
export async function classifyListing({ title, description, suburb, state }) {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPrompt(title, description, suburb, state),
        },
      ],
    });

    // Extract the text content from the response
    const raw = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Strip any accidental markdown fences Claude might add
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(clean);

    // Safety check — make sure required fields exist
    if (typeof result.is_job_request !== "boolean") {
      throw new Error("Missing is_job_request in response");
    }

    return {
      success: true,
      data: result,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (err) {
    console.error("[classifier] Error:", err.message);

    // On any failure, return a safe default — don't crash the whole run
    return {
      success: false,
      data: {
        is_job_request: false,
        trade_types: [],
        urgency: "unknown",
        job_scope: null,
        budget_min: null,
        budget_max: null,
        budget_text: null,
        contact_name: null,
        summary: "",
        score: 0,
        score_breakdown: {
          urgency_score: 0,
          budget_score: 0,
          description_quality: 0,
          trade_clarity: 0,
        },
      },
      tokens: 0,
      error: err.message,
    };
  }
}
