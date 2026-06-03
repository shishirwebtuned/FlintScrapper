import { NextRequest, NextResponse } from "next/server";
import { getPayPalToken } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.subscription_id) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 },
      );
    }

    const token = await getPayPalToken();

    // Cancel with PayPal
    await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/billing/subscriptions/${profile.subscription_id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Customer requested cancellation" }),
      },
    );

    // Update Supabase
    await serviceSupabase
      .from("profiles")
      .update({
        tier: "trial",
        subscription_status: "cancelled",
        subscription_id: null,
        leads_limit: 3,
      })
      .eq("id", user.id);

    await serviceSupabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", profile.subscription_id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal/cancel]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
