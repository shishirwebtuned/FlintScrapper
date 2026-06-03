import { createClient } from "@supabase/supabase-js";
import { LIMITS } from "../config.js";
import { sendLeadEmail } from "./mailer.js";

// ------------------------------------------------------------------
// PART 1 — Supabase client singleton
// Uses the service role key so it bypasses RLS entirely.
// Never expose this key on the frontend.
// ------------------------------------------------------------------
let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error(
      "[db] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment",
    );
  }

  supabaseInstance = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return supabaseInstance;
}

// ------------------------------------------------------------------
// PART 2 — Save a classified lead to the leads table
// Returns the saved lead row, or null if it was a duplicate
// ------------------------------------------------------------------
export async function saveLead({
  sourceId,
  sourceUrl,
  rawTitle,
  rawText,
  classification,
  postcode,
  suburb,
  state,
  latitude,
  longitude,
}) {
  const supabase = getSupabase();

  // Build the PostGIS location string from lat/lng
  // Supabase accepts this WKT format directly
  const location =
    latitude && longitude ? `POINT(${longitude} ${latitude})` : null;

  const leadRow = {
    // Source
    source: "gumtree",
    source_url: sourceUrl,
    source_id: sourceId,
    source_scraped_at: new Date().toISOString(),

    // Raw content
    raw_title: rawTitle,
    raw_text: rawText?.slice(0, 5000) || null, // Cap to avoid DB bloat

    // AI classification
    trade_types: classification.trade_types || [],
    ai_summary: classification.summary || null,
    score: classification.score || 0,
    score_breakdown: classification.score_breakdown || null,
    urgency: classification.urgency || "unknown",
    job_scope: classification.job_scope || null,
    budget_min: classification.budget_min || null,
    budget_max: classification.budget_max || null,
    budget_text: classification.budget_text || null,
    contact_name: classification.contact_name || null,

    // Location
    postcode: postcode || null,
    suburb: suburb || null,
    state: state || null,
    location, // PostGIS WKT point — trigger won't fire here, direct insert

    // Lifecycle
    status: "new",
    max_matches: LIMITS.maxMatchesPerLead,
    expires_at: new Date(
      Date.now() + LIMITS.leadExpiryDays * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };

  let data, error;
  for (let attempt = 1; attempt <= 3; attempt++) {
    ({ data, error } = await supabase
      .from("leads")
      .upsert(leadRow, {
        onConflict: "source_id",
        ignoreDuplicates: true,
      })
      .select()
      .single());

    if (!error) break;

    // PGRST116 = duplicate ignored, not a real error
    if (error.code === "PGRST116") break;

    // On fetch failure, wait and retry
    if (attempt < 3) {
      console.warn(`[db] saveLead attempt ${attempt} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Duplicate silently ignored — expected
    }
    console.error("[db] saveLead error:", error.message);
    return null;
  }

  return data || null;
}

// ------------------------------------------------------------------
// PART 3 — Run the matching RPC after saving a lead
// Finds all matching tradies and inserts into lead_matches
// ------------------------------------------------------------------
export async function matchLead(leadId) {
  const supabase = getSupabase();

  const { error } = await supabase.rpc("find_matching_tradies", {
    p_lead_id: leadId,
    p_max_matches: LIMITS.maxMatchesPerLead,
  });

  if (error) {
    console.error("[db] matchLead error:", error.message);
    return false;
  }

  return true;
}

// ------------------------------------------------------------------
// PART 4 — Scraper run logging
// Call startRun() at the beginning, updateRun() throughout,
// and finishRun() at the end of every scraper execution.
// ------------------------------------------------------------------
export async function startRun() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("scraper_runs")
    .insert({
      source: "gumtree",
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[db] startRun error:", error.message);
    return null;
  }

  return data.id;
}

export async function finishRun(runId, stats) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("scraper_runs")
    .update({
      status: stats.status || "completed",
      finished_at: new Date().toISOString(),
      urls_scraped: stats.urlsScraped || 0,
      items_seen: stats.itemsSeen || 0,
      items_filtered: stats.itemsFiltered || 0,
      items_classified: stats.itemsClassified || 0,
      leads_created: stats.leadsCreated || 0,
      leads_duped: stats.leadsDuped || 0,
      ai_calls: stats.aiCalls || 0,
      ai_tokens_used: stats.aiTokensUsed || 0,
      errors: stats.errors || [],
    })
    .eq("id", runId);

  if (error) {
    console.error("[db] finishRun error:", error.message);
  }
}

// ------------------------------------------------------------------
// PART 5 — Create notifications for matched tradies
// Called after matchLead() so lead_matches rows already exist
// ------------------------------------------------------------------
export async function notifyTradies(leadId) {
  const supabase = getSupabase();

  // Get all matches for this lead with tradie profile data
  const { data: matches, error } = await supabase
    .from("lead_matches")
    .select(
      `
      id,
      tradie_id,
      match_score,
      profiles (
        contact_name,
        email,
        email_notifications
      ),
      leads (
        raw_title,
        trade_types,
        suburb,
        state,
        urgency,
        ai_summary
      )
    `,
    )
    .eq("lead_id", leadId)
    .eq("status", "sent");

  if (error || !matches || matches.length === 0) return;

  const notifications = matches.map((match) => {
    const lead = match.leads;
    const urgencyLabel =
      lead.urgency === "emergency"
        ? "🚨 Emergency"
        : lead.urgency === "this_week"
          ? "⚡ This week"
          : lead.urgency === "this_month"
            ? "📅 This month"
            : "🔔 New";

    const tradeLabel = lead.trade_types?.[0]
      ? lead.trade_types[0].charAt(0).toUpperCase() +
        lead.trade_types[0].slice(1)
      : "Trade";

    return {
      tradie_id: match.tradie_id,
      lead_match_id: match.id,
      type: "new_lead",
      channel: "push",
      title: `${urgencyLabel} ${tradeLabel} lead — ${lead.suburb || "NSW"}`,
      body: lead.ai_summary ? lead.ai_summary.slice(0, 120) : lead.raw_title,
      delivered: false,
      sent_at: new Date().toISOString(),
    };
  });

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    console.error("[db] notifyTradies error:", insertError.message);
    return;
  }

  console.log(
    `[db] Created ${notifications.length} notification(s) for lead ${leadId}`,
  );

  // Send emails to tradies with email notifications enabled
  for (const match of matches) {
    if (!match.profiles?.email_notifications) continue;
    if (!match.profiles?.email) continue;

    const lead = match.leads;
    const notif = notifications.find((n) => n.tradie_id === match.tradie_id);

    await sendLeadEmail({
      to: match.profiles.email,
      name: match.profiles.contact_name,
      title: lead.raw_title,
      summary: lead.ai_summary || lead.raw_title,
      suburb: lead.suburb,
      urgency: lead.urgency,
      matchId: match.id,
    });

    // Mark notification as delivered after email sent
    await supabase
      .from("notifications")
      .update({ delivered: true })
      .eq("tradie_id", match.tradie_id)
      .eq("lead_match_id", match.id)
      .eq("type", "new_lead");
  }
}
