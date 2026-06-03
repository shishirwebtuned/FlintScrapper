// scraper/mailer.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLeadEmail({
  to,
  name,
  title,
  summary,
  suburb,
  urgency,
  matchId,
}) {
  if (!process.env.RESEND_API_KEY) return;

  const urgencyLabel =
    urgency === "emergency"
      ? "🚨 Emergency"
      : urgency === "this_week"
        ? "⚡ This week"
        : urgency === "this_month"
          ? "📅 This month"
          : "🔔 New lead";

  try {
    await resend.emails.send({
      //   from: "Flint <leads@yourdomain.com.au>",

      from: "Flint <onboarding@resend.dev>",
      to,
      subject: `${urgencyLabel}: ${title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background: #f5f5f5; padding: 32px; margin: 0;">
          <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FF6B35, #E85A24); padding: 28px 32px;">
              <div style="font-size: 28px; font-weight: 900; color: white; letter-spacing: -1px;">
                F <span style="font-size: 18px; font-weight: 600;">Flint</span>
              </div>
              <div style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px;">
                New lead matched to you
              </div>
            </div>

            <!-- Body -->
            <div style="padding: 28px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #FF6B35; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                ${urgencyLabel}
              </div>
              <h2 style="font-size: 20px; font-weight: 800; color: #141210; margin: 0 0 12px; line-height: 1.3;">
                ${title}
              </h2>
              <p style="font-size: 15px; color: #4A4740; line-height: 1.7; margin: 0 0 20px;">
                ${summary}
              </p>

              <!-- Meta -->
              <div style="background: #F3F2EF; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #4A4740; margin-bottom: 6px;">
                  📍 <strong>${suburb || "NSW"}</strong>
                </div>
                <div style="font-size: 13px; color: #4A4740;">
                  ⚡ Matched ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}
                </div>
              </div>

              <!-- CTA -->
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/lead/${matchId}"
                style="display: block; text-align: center; background: linear-gradient(135deg, #FF6B35, #E85A24); color: white; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none;">
                View lead →
              </a>
            </div>

            <!-- Footer -->
            <div style="padding: 20px 32px; border-top: 1px solid #E0DDD8; text-align: center;">
              <p style="font-size: 12px; color: #8A8780; margin: 0;">
                You're receiving this because you're subscribed to Flint lead alerts.<br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings" style="color: #FF6B35;">Manage notifications</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("[mailer] Failed to send email:", err.message);
  }
}
