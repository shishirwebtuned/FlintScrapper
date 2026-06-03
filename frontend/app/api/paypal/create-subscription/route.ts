import { NextRequest, NextResponse } from "next/server";
import { getPayPalToken, PLANS, PlanId } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json();

    if (!PLANS[tier as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plan = PLANS[tier as PlanId];
    const token = await getPayPalToken();

    // Step 1 — Create a PayPal billing plan
    const planRes = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/billing/plans`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: await getOrCreateProduct(token, tier),
          name: `Flint ${plan.name}`,
          description: plan.description,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: { interval_unit: "MONTH", interval_count: 1 },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: 0, // 0 = infinite
              pricing_scheme: {
                fixed_price: { value: plan.price, currency_code: "AUD" },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: { value: "0", currency_code: "AUD" },
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
          },
        }),
      },
    );

    const billingPlan = await planRes.json();

    // Step 2 — Create subscription
    const subRes = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/billing/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: billingPlan.id,
          custom_id: user.id, // store supabase user ID
          application_context: {
            brand_name: "Flint",
            locale: "en-AU",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/success?tier=${tier}&userId=${user.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?cancelled=true`,
          },
        }),
      },
    );

    const subscription = await subRes.json();

    // Find the approval URL to redirect user to
    const approvalUrl = subscription.links?.find(
      (l: { rel: string; href: string }) => l.rel === "approve",
    )?.href;

    if (!approvalUrl) {
      console.error("[paypal] No approval URL:", subscription);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: approvalUrl,
      subscriptionId: subscription.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal/create-subscription]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper — get or create PayPal product for Flint
async function getOrCreateProduct(
  token: string,
  tier: string,
): Promise<string> {
  const res = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/catalogs/products`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Flint ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        description: "AI-powered tradie lead generation",
        type: "SERVICE",
        category: "SOFTWARE",
      }),
    },
  );
  const product = await res.json();
  return product.id;
}
