import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

type EmailAttachment = {
  filename: string;
  content: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  if (!resendApiKey) {
    console.log("Email skipped: RESEND_API_KEY not set");
    return { skipped: true };
  }

  const resend = new Resend(resendApiKey);

  const resendAttachments =
    attachments.length > 0
      ? attachments.map((file) => ({
          filename: file.filename,
          content: file.content.replace(
            /^data:.*;base64,/,
            ""
          ),
        }))
      : undefined;

  return await resend.emails.send({
    from: "ICDE HR Management <onboarding@resend.dev>",
    to,
    subject,
    html,
    attachments: resendAttachments,
  });
}
