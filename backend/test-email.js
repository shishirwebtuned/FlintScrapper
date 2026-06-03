// test-email.js
import "dotenv/config";
import { sendLeadEmail } from "./scraper/mailer.js";

await sendLeadEmail({
  to: "shishirwebtunedstudio@gmail.com", // ← your actual email
  name: "Dave",
  title: "Burst pipe under kitchen sink — need urgent help",
  summary:
    "Homeowner in Parramatta needs an emergency plumber today. Water leak under kitchen sink.",
  suburb: "Parramatta",
  urgency: "emergency",
  matchId: "test-match-id",
});

console.log("Test email sent — check your inbox!");
