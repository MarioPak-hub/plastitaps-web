import { sendEmail, escape } from './emailService.js';
import { loadStore, saveStore } from '../utils/jsonStore.js';

// ── Persistencia simple ──────────────────────────────────────────────────────
// In-memory store, hidratado al boot desde /server/data/quotes-store.json
// y re-escrito a disco en cada mutación. Esto garantiza que los folios
// (y su estado actualizado por webhooks de Bind) sobreviven a reinicios.
const STORE_FILE  = 'quotes-store.json';
const quotesStore = loadStore(STORE_FILE);

// Tombstones: folios que Bind eliminó vía DELETE webhook. Persistidos en su
// propio archivo. Permiten que el GET /:folio distinga "borrado intencional"
// (deleted:true) de "ausente por reinicio con JSON vacío" (record:null sin flag),
// evitando que el polling borre datos de Firestore por error tras un reinicio.
const DELETED_FILE  = 'quotes-deleted.json';
const deletedFolios = new Set(loadStore(DELETED_FILE));

function persist() {
  saveStore(STORE_FILE, quotesStore);
}

function persistDeleted() {
  saveStore(DELETED_FILE, [...deletedFolios]);
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
 * Elimina un folio del store y lo registra como tombstone.
 * Idempotente: si el folio no estaba en el store, igual lo marca como borrado
 * para que el GET responda deleted:true en futuros polls.
 * Devuelve true si el folio estaba presente en el store, false si no.
 */
export function deleteQuote(folio) {
  const idx = quotesStore.findIndex(q => q.folio === folio);
  const existed = idx !== -1;
  if (existed) {
    quotesStore.splice(idx, 1); // splice in-place: preserva la referencia const
    persist();
  }
  if (!deletedFolios.has(folio)) {
    deletedFolios.add(folio);
    persistDeleted();
  }
  return existed;
}

/** true si el folio fue eliminado vía DELETE webhook de Bind (tombstone). */
export function isDeleted(folio) {
  return deletedFolios.has(folio);
}

/**
 * Actualiza el estado de una cotización en el store en memoria.
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

/**
 * Upsert del estado por folio.
 * Si el folio ya existe → lo actualiza.
 * Si NO existe (típico tras reiniciar el servidor: el store in-memory está vacío
 * pero Bind sigue mandando webhooks con folios viejos) → crea un registro
 * mínimo con `syncedToBind: true` para que el siguiente polling del frontend
 * lo lea y propague el estado a Firestore vía `updateEstado(folio, estado)`.
 *
 * Devuelve { record, created } — created=true cuando hubo que insertarlo.
 */
export function upsertEstado(folio, estado) {
  const existing = quotesStore.find(q => q.folio === folio);
  if (existing) {
    existing.estado    = estado;
    existing.updatedAt = new Date().toISOString();
    persist();
    return { record: existing, created: false };
  }

  const now = new Date().toISOString();
  const minimal = {
    folio,
    estado,
    syncedToBind: true,
    bindFolioId:  null,
    savedAt:      now,
    updatedAt:    now,
  };
  quotesStore.push(minimal);
  persist();
  return { record: minimal, created: true };
}

/**
 * Marca el record como sincronizado con Bind y guarda el bindFolioId.
 * Devuelve el record actualizado o null si no existe.
 */
export function markSynced(folio, bindFolioId) {
  const record = quotesStore.find(q => q.folio === folio);
  if (!record) return null;
  record.syncedToBind = true;
  record.bindFolioId  = bindFolioId || null;
  record.updatedAt    = new Date().toISOString();
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

export async function sendToBind(payload) {
  const baseUrl = process.env.BIND_API_URL;
  const apiKey  = process.env.BIND_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn('[Bind] BIND_API_URL o BIND_API_KEY no configuradas — skipping sync para', payload.folio);
    return { skipped: true };
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/ecommerce/quote`;

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
    console.log(`[Bind] sendToBind quotes ✓ ${payload.folio} → bindFolioId=${bindFolioId || 'n/a'}`);
    return { success: true, bindFolioId, response: data };
  } catch (err) {
    console.error(`[Bind] sendToBind quotes ✗ ${payload.folio}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Notifica a Bind que una solicitud fue cancelada por el cliente.
 * Outbound, mismo patrón que sendToBind (X-API-Key + BIND_API_URL).
 * Fire-and-forget: si Bind falla, la cancelación local sigue válida.
 *
 * Identifica la solicitud por nuestro `folio` (no por bindFolioId) — Bind
 * espera el folio en la URL para resolver la solicitud en su lado.
 *
 * Skip silencioso solo si BIND_API_URL/KEY no están configuradas (dev sin Bind).
 */
export async function notifyBindCancellation(folio) {
  const baseUrl = process.env.BIND_API_URL;
  const apiKey  = process.env.BIND_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn('[Cancel→Bind] skip (sin config):', folio);
    return { skipped: true, reason: 'no-config' };
  }

  const url  = `${baseUrl.replace(/\/$/, '')}/api/ecommerce/requests/${folio}/status`;
  const body = { estado: 'cancelada', usuario: 'cliente' };

  console.log('[Cancel→Bind] enviando:', url, body);

  try {
    const res = await fetch(url, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key':    apiKey,
      },
      body: JSON.stringify(body),
    });

    console.log('[Cancel→Bind] respuesta:', res.status);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Bind respondió ${res.status}: ${text.slice(0, 200)}`);
    }
    return { success: true };
  } catch (err) {
    console.error(`[Cancel→Bind] error ${folio}:`, err.message);
    return { success: false, error: err.message };
  }
}
