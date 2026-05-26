import { sendEmail, escape } from './emailService.js';

// In-memory store — replace with database in production
const ordersStore = [];

export function saveOrder(payload) {
  ordersStore.push({ ...payload, savedAt: new Date().toISOString() });
  return payload;
}

export function getOrders() {
  return [...ordersStore];
}

export function getOrderByFolio(folio) {
  return ordersStore.find(o => o.folio === folio) || null;
}

export function updateEstado(folio, estado) {
  const record = ordersStore.find(o => o.folio === folio);
  if (!record) return null;
  record.estado    = estado;
  record.updatedAt = new Date().toISOString();
  return record;
}

export function markSynced(folio, bindFolioId) {
  const record = ordersStore.find(o => o.folio === folio);
  if (!record) return null;
  record.syncedToBind = true;
  record.bindFolioId  = bindFolioId || null;
  record.updatedAt    = new Date().toISOString();
  return record;
}

export async function sendOrderEmail(payload) {
  const fmtMXN = (n) => (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
  const fmtP   = (n) => (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 4 });

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

export async function sendToBind(payload) {
  const baseUrl = process.env.BIND_API_URL;
  const apiKey  = process.env.BIND_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn('[Bind] BIND_API_URL o BIND_API_KEY no configuradas — skipping sync para', payload.folio);
    return { skipped: true };
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/ecommerce/order`;

  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Bind respondió ${res.status}: ${text.slice(0, 200)}`);
    }

    const data        = await res.json().catch(() => ({}));
    const bindFolioId = data.bindFolioId || data.id || null;
    markSynced(payload.folio, bindFolioId);
    console.log(`[Bind] sendToBind checkout ✓ ${payload.folio} → bindFolioId=${bindFolioId || 'n/a'}`);
    return { success: true, bindFolioId, response: data };
  } catch (err) {
    console.error(`[Bind] sendToBind checkout ✗ ${payload.folio}:`, err.message);
    return { success: false, error: err.message };
  }
}
