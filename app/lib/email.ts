import nodemailer from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || !pass) {
    throw new Error(
      "Kredensial Gmail SMTP (GMAIL_USER & GMAIL_APP_PASS) belum dikonfigurasi di file .env.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from: `"Bank Sampah Indofood" <${user}>`,
    to,
    subject,
    text,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email successfully sent: ${info.messageId}`);
  return info;
}
