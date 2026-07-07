import nodemailer from "nodemailer";

// Builds a nodemailer transport from environment variables. Returns null when
// SMTP isn't configured so callers can degrade gracefully (e.g. in local dev).
function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  const port = Number(SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // true for 465, false for 587/STARTTLS
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

// Sends the password-reset email. Critically, the reset link is delivered ONLY
// via email and is never returned to the API caller. When SMTP is not
// configured (typically local dev), the link is logged to the server console so
// developers can still test the flow without exposing it to the client.
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<{ delivered: boolean }> {
  const transport = buildTransport();

  if (!transport) {
    console.log(
      `[mailer] SMTP not configured. Password reset link for ${to}: ${resetLink}`
    );
    return { delivered: false };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transport.sendMail({
    from,
    to,
    subject: "Reset your Buddy password",
    text:
      `You requested a password reset for your Buddy account.\n\n` +
      `Open this link to set a new password (valid for 15 minutes):\n${resetLink}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html:
      `<p>You requested a password reset for your Buddy account.</p>` +
      `<p>Click the link below to set a new password. This link is valid for 15 minutes:</p>` +
      `<p><a href="${resetLink}">Reset my password</a></p>` +
      `<p>If you didn't request this, you can safely ignore this email.</p>`,
  });

  return { delivered: true };
}
