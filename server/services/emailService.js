import { Resend } from 'resend';

// Render bloquea los puertos SMTP salientes (25/465/587) en su plan free, así que
// el envío vía nodemailer/Gmail se queda colgado hasta el timeout. Resend usa su
// API HTTPS (puerto 443, nunca bloqueado) y tiene 3,000 emails/mes gratis.
let _resend = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getResend() {
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function escape(str) { return escapeHtml(str); }

export async function sendEmail({ to, subject, html, attachments = [] }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[emailService] RESEND_API_KEY not configured — skipping send');
    return { skipped: true };
  }
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Plastitaps <onboarding@resend.dev>',
    to,
    subject,
    html,
    attachments: attachments.map(a => ({
      filename: a.filename,
      content:  a.content,
    })),
  });
  if (error) throw new Error(error.message || 'Resend send failed');
  return data;
}
