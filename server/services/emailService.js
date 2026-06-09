import nodemailer from 'nodemailer';

let _transporter = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

export function escape(str) { return escapeHtml(str); }

export async function sendEmail({ to, subject, html, attachments = [] }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[emailService] SMTP not configured — skipping send');
    return { skipped: true };
  }
  const transporter = getTransporter();
  return transporter.sendMail({
    from:        `Plastitaps <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}
