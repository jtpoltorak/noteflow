import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getFrom(): string {
  return process.env.SMTP_FROM || "NoteFlow <noreply@noteflow.app>";
}

export async function sendAccountClosureRequestedEmail(
  to: string,
  deletionDate: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP not configured, skipping closure-requested email");
    return;
  }

  try {
    await getTransporter().sendMail({
      from: getFrom(),
      to,
      subject: "Your NoteFlow account is scheduled for deletion",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Account Closure Requested</h2>
          <p style="color: #374151; line-height: 1.6;">
            We received your request to close your NoteFlow account. Your account and all
            associated data will be <strong>permanently deleted on ${deletionDate}</strong>.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            If you change your mind, simply log back in to NoteFlow before that date and
            click <strong>"Cancel and keep my account"</strong> to reactivate.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            If you did not request this, please log in immediately and reactivate your account,
            then change your password.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] Failed to send closure-requested email:", err);
  }
}

export async function sendAccountDeletedEmail(to: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP not configured, skipping account-deleted email");
    return;
  }

  try {
    await getTransporter().sendMail({
      from: getFrom(),
      to,
      subject: "Your NoteFlow account has been permanently deleted",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Account Permanently Deleted</h2>
          <p style="color: #374151; line-height: 1.6;">
            Your NoteFlow account and all associated data have been permanently deleted.
            This action cannot be undone.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            If you'd like to use NoteFlow again in the future, you're welcome to create
            a new account at any time.
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Thank you for using NoteFlow. We're sorry to see you go.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] Failed to send account-deleted email:", err);
  }
}
