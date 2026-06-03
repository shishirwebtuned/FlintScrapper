import { NextRequest, NextResponse } from "next/server";
import { getPayPalToken, PLANS, PlanId } from "@/lib/paypal";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get("tier") as PlanId;
  const userId = searchParams.get("userId");
  const subscriptionId = searchParams.get("subscription_id"); // PayPal sends this

  if (!tier || !userId || !subscriptionId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`,
    );
  }

  try {
    const token = await getPayPalToken();
    const plan = PLANS[tier];

    // Verify subscription is active with PayPal
    const subRes = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const sub = await subRes.json();

    if (sub.status !== "ACTIVE" && sub.status !== "APPROVAL_PENDING") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=subscription_not_active`,
      );
    }

    // Update Supabase profile
    await supabase
      .from("profiles")
      .update({
        tier,
        subscription_id: subscriptionId,
        subscription_status: "active",
        leads_limit: plan.leads,
      })
      .eq("id", userId);

    // Create subscription record
    await supabase.from("subscriptions").insert({
      tradie_id: userId,
      tier,
      status: "active",
      stripe_subscription_id: subscriptionId, // reusing this column for PayPal ID
      current_period_start: new Date().toISOString(),
    });

    // Log billing event
    await supabase.from("billing_events").insert({
      profile_id: userId,
      type: "subscription.activated",
      stripe_event_id: subscriptionId,
      stripe_payload: sub,
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&tier=${tier}`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal/success]", message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=server_error`,
    );
  }
}
