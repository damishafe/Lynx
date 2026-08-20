import nodemailer, { type Transporter } from "nodemailer";

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD must be set. Generate an app password at https://myaccount.google.com/apppasswords.",
    );
  }
  cachedTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cachedTransport;
}

function fromHeader(): string {
  const user = process.env.GMAIL_USER ?? "noreply@example.com";
  const name = process.env.GMAIL_FROM_NAME ?? "Lynx";
  return `"${name}" <${user}>`;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------- Shared layout ----------
// One template, three transactional emails. Email-safe: tables + inline
// styles, no flexbox/grid, no webfonts, no external CSS. Single CTA.

type Section = {
  preheader: string;
  title: string;
  intro: string;
  /** Optional callout box (used for the OTP code). */
  callout?: { value: string; caption?: string; mono?: boolean };
  /** Optional CTA button. */
  cta?: { href: string; label: string };
  /** Optional second paragraph below the CTA. */
  closing?: string;
  /** Optional footnote (typically "if this wasn't you…"). */
  footnote?: string;
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function shell(s: Section): string {
  const callout = s.callout
    ? `
              <tr>
                <td style="padding-bottom:32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9FAFB;border:1px solid #f1f5f9;border-radius:20px;">
                    <tr>
                      <td align="center" style="padding:28px 24px;${
                        s.callout.mono
                          ? "font-family:'SF Mono','Menlo','Consolas',monospace;letter-spacing:8px;"
                          : ""
                      }font-size:36px;font-weight:600;color:#09090B;line-height:1;">
                        ${escapeHtml(s.callout.value)}
                      </td>
                    </tr>
                    ${
                      s.callout.caption
                        ? `<tr><td align="center" style="padding:0 24px 20px;font-size:12px;font-weight:500;color:#9ca3af;letter-spacing:0.02em;">${escapeHtml(s.callout.caption)}</td></tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>`
    : "";
  const cta = s.cta
    ? `
              <tr>
                <td style="padding-bottom:32px;">
                  <a href="${s.cta.href}" style="display:inline-block;background:#09090B;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:999px;font-size:14px;font-weight:500;letter-spacing:-0.1px;">${escapeHtml(s.cta.label)} &rarr;</a>
                </td>
              </tr>`
    : "";
  const closing = s.closing
    ? `
              <tr>
                <td style="padding-bottom:24px;font-size:15px;line-height:1.6;color:#6b7280;font-weight:500;">${escapeHtml(s.closing)}</td>
              </tr>`
    : "";
  const footnote = s.footnote
    ? `
              <tr>
                <td style="padding-top:24px;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.6;color:#9ca3af;font-weight:500;">${escapeHtml(s.footnote)}</td>
              </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(s.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F3F4F6;font-family:${FONT_STACK};color:#09090B;">
    <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#F3F4F6;">${escapeHtml(s.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #f1f5f9;border-radius:32px;padding:40px;">
            <tr>
              <td style="padding-bottom:32px;font-size:18px;font-weight:600;letter-spacing:-0.5px;color:#09090B;">
                Lynx
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;font-size:28px;line-height:1.1;font-weight:600;letter-spacing:-1px;color:#09090B;">${escapeHtml(s.title)}</td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;font-size:15px;line-height:1.6;color:#6b7280;font-weight:500;">${escapeHtml(s.intro)}</td>
            </tr>
            ${callout}
            ${cta}
            ${closing}
            ${footnote}
          </table>
          <div style="padding-top:16px;font-size:11px;color:#9ca3af;font-family:${FONT_STACK};">© ${new Date().getFullYear()} Lynx, Inc.</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function plainText(lines: string[]): string {
  return lines.filter(Boolean).join("\n\n");
}

// ---------- Public sends ----------

export async function sendOtpEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const html = shell({
    preheader: `Your Lynx verification code is ${code}`,
    title: `Verify your email`,
    intro: `Hi ${name} — use the code below to finish setting up your Lynx account. It expires in 10 minutes.`,
    callout: {
      value: code,
      caption: "Verification code",
      mono: true,
    },
    footnote:
      "If you didn't request this code, you can safely ignore this email — no account changes will be made.",
  });
  const text = plainText([
    `Hi ${name},`,
    `Your Lynx verification code is ${code}.`,
    `It expires in 10 minutes.`,
    `If you didn't request this code, you can ignore this email.`,
    `— The Lynx team`,
  ]);
  await getTransport().sendMail({
    from: fromHeader(),
    to,
    subject: `Your Lynx code: ${code}`,
    text,
    html,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<void> {
  const html = shell({
    preheader: `Welcome to Lynx, ${name} — your operations command center is ready.`,
    title: `Welcome to Lynx, ${name}.`,
    intro: `You're in. Every unit, every vendor, and every dollar — finally in one place. Open your dashboard to connect your first unit and start running tighter operations.`,
    cta: {
      href: `${siteUrl()}/dashboard`,
      label: "Open your dashboard",
    },
    footnote:
      "You're receiving this because you just verified your Lynx account.",
  });
  const text = plainText([
    `Welcome to Lynx, ${name}.`,
    `You're in. Every unit, every vendor, and every dollar — finally in one place.`,
    `Open your dashboard: ${siteUrl()}/dashboard`,
    `— The Lynx team`,
  ]);
  await getTransport().sendMail({
    from: fromHeader(),
    to,
    subject: "Welcome to Lynx",
    text,
    html,
  });
}

function formatMoney(cents: number): string {
  const abs = Math.abs(cents) / 100;
  return `$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateOnly(d?: Date): string {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Sent to the vendor whenever a manager assigns them a new work order.
 * Includes a deep link to their vendor portal so they can mark complete in
 * one tap on mobile.
 */
export async function sendWorkOrderAssignedEmail({
  to,
  vendorName,
  managerName,
  jobTitle,
  jobType,
  unitName,
  costCents,
  dueAt,
  vendorId,
  notes,
}: {
  to: string;
  vendorName: string;
  managerName: string;
  jobTitle: string;
  jobType: string;
  unitName: string;
  costCents: number;
  dueAt?: Date;
  vendorId: string;
  notes?: string;
}): Promise<void> {
  const portal = `${siteUrl()}/vendor/${vendorId}`;
  const detailLines = [
    `Job: ${jobTitle}`,
    `Type: ${jobType}`,
    `Unit: ${unitName}`,
    `Pay on completion: ${formatMoney(costCents)}`,
    `Due: ${formatDateOnly(dueAt)}`,
  ];
  if (notes) detailLines.push(`Notes: ${notes}`);

  const html = shell({
    preheader: `New job from ${managerName}: ${jobTitle} at ${unitName}`,
    title: `New job from ${managerName}`,
    intro: `Hi ${vendorName} — ${managerName} just assigned you a ${jobType} job at ${unitName}. Open the portal to see the full brief and tap Mark complete the moment you're done.`,
    callout: {
      value: formatMoney(costCents),
      caption: "Pay on completion",
    },
    cta: { href: portal, label: "Open vendor portal" },
    closing: `${jobTitle} · ${unitName} · due ${formatDateOnly(dueAt)}${notes ? `\n\nNotes: ${notes}` : ""}`,
    footnote:
      "Marking complete in the portal pays you out and updates the manager dashboard automatically.",
  });
  const text = plainText([
    `Hi ${vendorName},`,
    `${managerName} just assigned you a new job on Lynx.`,
    detailLines.join("\n"),
    `Open the vendor portal: ${portal}`,
    `— The Lynx team`,
  ]);
  await getTransport().sendMail({
    from: fromHeader(),
    to,
    subject: `New job: ${jobTitle}`,
    text,
    html,
  });
}

/**
 * Sent to the manager when a vendor marks one of their work orders complete.
 * Confirms the unit flipped to Ready and a pending payout was created.
 */
export async function sendWorkOrderCompletedEmail({
  to,
  managerName,
  vendorName,
  jobTitle,
  unitName,
  costCents,
}: {
  to: string;
  managerName: string;
  vendorName: string;
  jobTitle: string;
  unitName: string;
  costCents: number;
}): Promise<void> {
  const dashboard = `${siteUrl()}/dashboard`;
  const html = shell({
    preheader: `${vendorName} marked ${jobTitle} complete at ${unitName}`,
    title: `Job completed`,
    intro: `Hi ${managerName} — ${vendorName} just marked ${jobTitle} complete at ${unitName}. The unit is back to Ready and a pending payout has been queued for your records.`,
    callout: {
      value: formatMoney(costCents),
      caption: "Pending payout",
    },
    cta: { href: dashboard, label: "Open dashboard" },
    footnote:
      "Pending payouts roll into your owed-to-vendors balance until you mark them paid.",
  });
  const text = plainText([
    `Hi ${managerName},`,
    `${vendorName} just marked ${jobTitle} complete at ${unitName}.`,
    `The unit is back to Ready, and ${formatMoney(costCents)} has been queued as a pending payout.`,
    `Open dashboard: ${dashboard}`,
    `— The Lynx team`,
  ]);
  await getTransport().sendMail({
    from: fromHeader(),
    to,
    subject: `${vendorName} completed ${jobTitle}`,
    text,
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const html = shell({
    preheader: `Reset your Lynx password — link expires in 1 hour.`,
    title: `Reset your password`,
    intro: `Hi ${name} — we got a request to reset your Lynx password. Click the button below to choose a new one. The link expires in 1 hour.`,
    cta: { href: link, label: "Reset password" },
    closing: `If the button doesn't work, copy and paste this link into your browser:\n${link}`,
    footnote:
      "If you didn't request a password reset, you can safely ignore this email — your password will stay the same.",
  });
  const text = plainText([
    `Hi ${name},`,
    `We got a request to reset your Lynx password.`,
    `Reset link (expires in 1 hour): ${link}`,
    `If you didn't request this, you can ignore this email.`,
    `— The Lynx team`,
  ]);
  await getTransport().sendMail({
    from: fromHeader(),
    to,
    subject: "Reset your Lynx password",
    text,
    html,
  });
}
