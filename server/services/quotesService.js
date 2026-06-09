import { sendEmail, escape } from './emailService.js';
import { loadStore, saveStore } from '../utils/jsonStore.js';

// ── Persistencia simple ──────────────────────────────────────────────────────
// Store in-memory de cotizaciones, hidratado al boot desde quotes-store.json
// y re-escrito a disco en cada mutación (sobrevive reinicios del server).
const STORE_FILE  = 'quotes-store.json';
const quotesStore = loadStore(STORE_FILE);

function persist() {
  saveStore(STORE_FILE, quotesStore);
}

export function saveQuote(payload) {
  quotesStore.push({ ...payload, savedAt: new Date().toISOString() });
  persist();
  return payload;
}

export function getQuotes() {
  return [...quotesStore];
}

export function getQuoteByFolio(folio) {
  return quotesStore.find(q => q.folio === folio) || null;
}

/**
 * Actualiza el estado de una cotización en el store.
 * Devuelve el record actualizado o null si no existe.
 */
export function updateEstado(folio, estado) {
  const record = quotesStore.find(q => q.folio === folio);
  if (!record) return null;
  record.estado    = estado;
  record.updatedAt = new Date().toISOString();
  persist();
  return record;
}

export async function notifyVentas(payload) {
  const rows = (payload.productos || []).map(p =>
    `<tr>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(p.nombre || p.name || '-')}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(String(p.cantidad || p.quantity || '-'))}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(p.color || '-')}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1e40af;color:white;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0">Nueva Cotización Personalizada</h2>
        <p style="margin:4px 0 0;opacity:0.8">Folio: ${escape(payload.folio)}</p>
      </div>
      <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0">
        <h3 style="color:#0f172a;margin-top:0">Datos del Cliente</h3>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#64748b;width:120px;padding:4px 0">Empresa:</td><td><strong>${escape(payload.cliente.empresa)}</strong></td></tr>
          <tr><td style="color:#64748b;padding:4px 0">RFC:</td><td>${escape(payload.cliente.rfc)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Nombre:</td><td>${escape(payload.cliente.nombre)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Email:</td><td>${escape(payload.cliente.email)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Teléfono:</td><td>${escape(payload.cliente.telefono)}</td></tr>
        </table>
        ${payload.logoUrl ? `<p><strong>Logo:</strong> <a href="${escape(payload.logoUrl)}">Ver archivo subido</a></p>` : ''}
        <h3 style="color:#0f172a">Configuración del Vaso</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
          <thead><tr style="background:#1e40af;color:white">
            <th style="padding:8px 10px;text-align:left">Descripción</th>
            <th style="padding:8px 10px;text-align:left">Cantidad</th>
            <th style="padding:8px 10px;text-align:left">Color</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="3" style="padding:10px;color:#94a3b8">Sin datos</td></tr>'}</tbody>
        </table>
        ${payload.observaciones ? `<p><strong>Observaciones:</strong> ${escape(payload.observaciones)}</p>` : ''}
        <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0"/>
        <p style="color:#64748b;font-size:12px">Recibido: ${new Date(payload.fecha).toLocaleString('es-MX')}</p>
      </div>
    </div>`;

  return sendEmail({
    to:      process.env.CONTACT_TO || 'ventas@plastitaps.com',
    subject: `[PLT] Cotización ${escape(payload.folio)} — ${escape(payload.cliente.empresa || payload.cliente.nombre)}`,
    html,
  });
}
