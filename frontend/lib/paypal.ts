// lib/paypal.ts

const BASE_URL = process.env.PAYPAL_BASE_URL!;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const SECRET = process.env.PAYPAL_SECRET!;

export async function getPayPalToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

// Plan config
export const PLANS = {
  spark: {
    name: "Spark",
    description: "5 leads per month — AI-matched tradie leads",
    price: "19.00",
    leads: 5,
  },
  blaze: {
    name: "Blaze",
    description: "15 leads per month — AI-matched tradie leads",
    price: "39.00",
    leads: 15,
  },
  inferno: {
    name: "Inferno",
    description: "Unlimited leads per month — AI-matched tradie leads",
    price: "69.00",
    leads: 9999,
  },
} as const;

export type PlanId = keyof typeof PLANS;
