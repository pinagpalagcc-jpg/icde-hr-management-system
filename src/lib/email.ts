import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resendApiKey) {
    console.log("Email skipped: RESEND_API_KEY not set");
    return { skipped: true };
  }

  const resend = new Resend(resendApiKey);

  return await resend.emails.send({
    from: "ICDE HR Management <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
}
