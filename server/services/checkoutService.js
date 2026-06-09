import { sendEmail, escape } from './emailService.js';
import { loadStore, saveStore } from '../utils/jsonStore.js';

// ── Persistencia simple ──────────────────────────────────────────────────────
// Store in-memory de pedidos/cotizaciones industriales, hidratado al boot desde
// orders-store.json y re-escrito a disco en cada mutación (sobrevive reinicios).
const STORE_FILE  = 'orders-store.json';
const ordersStore = loadStore(STORE_FILE);

function persist() {
  saveStore(STORE_FILE, ordersStore);
}

export function saveOrder(payload) {
  ordersStore.push({ ...payload, savedAt: new Date().toISOString() });
  persist();
  return payload;
}

export function getOrders() {
  return [...ordersStore];
}

export function getOrderByFolio(folio) {
  return ordersStore.find(o => o.folio === folio) || null;
}

/**
 * Actualiza el estado de un pedido en el store.
 * Devuelve el record actualizado o null si no existe.
 */
export function updateEstado(folio, estado) {
  const record = ordersStore.find(o => o.folio === folio);
  if (!record) return null;
  record.estado    = estado;
  record.updatedAt = new Date().toISOString();
  persist();
  return record;
}

export async function sendOrderEmail(payload) {
  // Vuln-fix 3: coerción explícita a Number antes de formatear.
  // Si p.price llega como string (p.ej. un payload malicioso), (n || 0) es truthy
  // y String.prototype.toLocaleString() devolvería el string sin cambios, inyectando
  // HTML arbitrario en el correo. Number() fuerza NaN → 0 para cualquier no-numérico.
  const fmtMXN = (n) => (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
  const fmtP   = (n) => (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 4 });

  const rows = (payload.productos || []).map(p =>
    `<tr>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(p.name)}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(p.category || '-')}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">${escape(String(p.quantity))} ${escape(p.unit || 'pz')}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">$${fmtP(p.price)}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0">$${fmtMXN(p.price * p.quantity)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#1e40af;color:white;padding:24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0">Cotización Industrial — ${escape(payload.folio)}</h2>
        <p style="margin:4px 0 0;opacity:0.8">Fecha: ${new Date(payload.fecha).toLocaleString('es-MX')}</p>
      </div>
      <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0">
        <h3 style="color:#0f172a;margin-top:0">Datos del Solicitante</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="color:#64748b;width:120px;padding:4px 0">Empresa:</td><td><strong>${escape(payload.cliente.empresa)}</strong></td></tr>
          <tr><td style="color:#64748b;padding:4px 0">RFC:</td><td>${escape(payload.cliente.rfc)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Email:</td><td>${escape(payload.cliente.email)}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Teléfono:</td><td>${escape(payload.cliente.telefono)}</td></tr>
        </table>
        <h3 style="color:#0f172a">Detalle de Productos</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
          <thead><tr style="background:#1e40af;color:white">
            <th style="padding:8px 10px;text-align:left">Producto</th>
            <th style="padding:8px 10px;text-align:left">Categoría</th>
            <th style="padding:8px 10px;text-align:left">Cantidad</th>
            <th style="padding:8px 10px;text-align:left">P. Unit.</th>
            <th style="padding:8px 10px;text-align:left">Subtotal</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="text-align:right;margin-top:16px;padding:16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe">
          <p style="margin:4px 0;color:#64748b">Subtotal (sin IVA): $${fmtMXN(payload.subtotal)}</p>
          <p style="margin:4px 0;font-weight:bold;font-size:18px;color:#1e40af">Total + IVA 16%: $${fmtMXN(payload.totalIVA)} MXN</p>
        </div>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0"/>
        <p style="color:#64748b;font-size:12px">Recibido: ${new Date(payload.fecha).toLocaleString('es-MX')}</p>
      </div>
    </div>`;

  return sendEmail({
    to:      process.env.CONTACT_TO || 'ventas@plastitaps.com',
    subject: `[PLT] Cotización Industrial ${escape(payload.folio)} — ${escape(payload.cliente.empresa || payload.cliente.email)}`,
    html,
  });
}
