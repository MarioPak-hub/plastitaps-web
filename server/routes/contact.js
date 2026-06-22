import { Router } from 'express';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { sendEmail, escape } from '../services/emailService.js';

const router = Router();

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
    }

    const html = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1e40af;color:white;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="margin:0">Nuevo Mensaje de Contacto</h2>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#64748b;width:100px;padding:6px 0">Nombre:</td><td><strong>${escape(nombre)}</strong></td></tr>
            <tr><td style="color:#64748b;padding:6px 0">Email:</td><td>${escape(email)}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0">Asunto:</td><td>${escape(asunto)}</td></tr>
          </table>
          <h3 style="color:#0f172a">Mensaje:</h3>
          <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escape(mensaje)}</div>
          <p style="color:#64748b;font-size:12px;margin-top:16px">Recibido: ${new Date().toLocaleString('es-MX')}</p>
        </div>
      </div>`;

    // No bloqueamos la respuesta esperando al correo (mismo patrón que /api/quotes
    // y /api/checkout) — evita que el formulario se quede "enviando" para siempre
    // si el SMTP no responde.
    sendEmail({
      to:      process.env.CONTACT_TO || 'ventas@plastitaps.com',
      subject: `[Web] ${escape(asunto)} — ${escape(nombre)}`,
      html,
    }).catch(err => console.error('[contact] email:', err.message));

    res.json({ success: true });
  } catch (err) {
    console.error('[contact] error:', err);
    res.status(500).json({ success: false, error: 'Error al enviar el mensaje. Intenta de nuevo.' });
  }
});

export default router;
