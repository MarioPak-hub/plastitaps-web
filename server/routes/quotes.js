import { Router } from 'express';
import { quoteLimiter } from '../middleware/rateLimiter.js';
import { buildQuotePayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { saveLogoBase64 } from '../utils/logoStorage.js';
import { bindAuth } from '../middleware/bindAuth.js';
import {
  saveQuote, getQuoteByFolio,
  updateEstado as updateQuotesEstado,
  upsertEstado as upsertQuotesEstado,
  notifyVentas, sendToBind, notifyBindCancellation,
  deleteQuote, isDeleted,
} from '../services/quotesService.js';
// Cross-store: Bind a veces manda PATCH/DELETE /api/quotes/:folio aunque el
// folio originalmente venga de POST /api/checkout/send (vive en ordersStore).
// Importamos updateEstado/deleteOrder del store ajeno para operar allá también.
import {
  updateEstado as updateCheckoutEstado,
  getOrderByFolio,
  deleteOrder,
} from '../services/checkoutService.js';

const router = Router();

// ── POST /api/quotes — registrar cotización personalizada ────────────────────
router.post('/', quoteLimiter, async (req, res) => {
  try {
    const {
      cliente, productos, logoUrl, logoBase64, logoExt,
      pdfUrl, observaciones, tipo,
    } = req.body;

    if (!cliente?.email) {
      return res.status(400).json({ success: false, error: 'Email del cliente requerido.' });
    }

    const folio = generateFolio();

    // Si llega base64, lo guardamos en /server/uploads/ y usamos esa ruta como logoUrl
    const savedLogoUrl = logoBase64
      ? saveLogoBase64(folio, logoBase64, logoExt)
      : null;

    const payload = buildQuotePayload({
      folio,
      tipo,
      cliente,
      productos,
      logoUrl: savedLogoUrl || logoUrl || null,
      pdfUrl,
      observaciones,
    });

    saveQuote(payload);

    notifyVentas(payload).catch(err => console.error('[quotes] email:', err.message));

    // sendToBind: race contra timeout corto. Si Bind responde rápido aprovechamos
    // para incluir syncedToBind:true + bindFolioId en el response (el badge del
    // cliente cambia de inmediato a "✓ Recibido por ventas"). Si no, sigue corriendo
    // en background — su markSynced() interno actualizará el store JSON cuando
    // termine, y el polling del cliente recogerá el syncedToBind:true luego.
    const BIND_RACE_MS = 3000;
    const bindResult = await Promise.race([
      sendToBind(payload).catch(err => {
        console.error('[quotes] bind:', err.message);
        return { success: false };
      }),
      new Promise(resolve => setTimeout(() => resolve({ raced: true }), BIND_RACE_MS)),
    ]);
    if (bindResult?.raced) {
      console.log(`[quotes] sendToBind no respondió en ${BIND_RACE_MS}ms para ${folio} — polling lo recogerá luego.`);
    }

    // Re-leer del store: si sendToBind ganó la carrera con éxito, markSynced ya
    // mutó el record con { syncedToBind:true, bindFolioId } y persistió a JSON.
    const record = getQuoteByFolio(folio) || payload;
    res.json({ success: true, folio, record });
  } catch (err) {
    console.error('[quotes] error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar la cotización.' });
  }
});

// ── GET /api/quotes/:folio — polling del estado actual desde el frontend ────
// Devuelve 200 con record:null cuando el folio no está en el store in-memory
// (típico tras reinicio: Firestore aún tiene el folio pero el server lo perdió).
// Así el cliente distingue "no hay actualización" de errores reales (5xx).
//
// Headers anti-caché: el polling cambia de respuesta frecuentemente, no queremos
// que el browser sirva 304/copia cacheada y perdamos los cambios de estado.
router.get('/:folio', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const folio  = req.params.folio;
  const record = getQuoteByFolio(folio);
  if (record) {
    return res.json({ success: true, record });
  }
  // No está en el store. Distinguir borrado intencional de ausencia por reinicio:
  //  - deleted:true → Bind lo eliminó → el polling propaga el borrado a Firestore.
  //  - sin flag      → posible cache miss tras reinicio → el cliente cae a Firestore.
  if (isDeleted(folio)) {
    return res.json({ success: true, record: null, deleted: true });
  }
  res.json({ success: true, record: null });
});

// ── PATCH /api/quotes/:folio/status — webhook entrante de Bind ──────────────
// Smart dual-store update — Bind no siempre sabe qué endpoint usar:
//   1. Intenta actualizar el folio en ambos stores (no inserta).
//   2. Si alguno lo tenía → listo, ese store se actualizó in-place.
//   3. Si ninguno lo tenía (reinicio del server) → upsert mínimo en quotesStore
//      (el nativo de este endpoint) para que el siguiente polling lo recoja.
// Así el frontend recibe el estado correcto sin importar a qué endpoint pegó Bind.
router.patch('/:folio/status', bindAuth, (req, res) => {
  const { estado } = req.body || {};
  if (!estado || typeof estado !== 'string') {
    return res.status(400).json({ success: false, error: 'Campo `estado` requerido.' });
  }

  const folio = req.params.folio;

  // 1+2. Update-only en ambos stores (no insertan)
  const inQuotes   = updateQuotesEstado(folio, estado);
  const inCheckout = updateCheckoutEstado(folio, estado);

  if (inQuotes || inCheckout) {
    return res.json({
      success: true,
      folio,
      estado,
      stores: { quotes: !!inQuotes, checkout: !!inCheckout },
      created: false,
    });
  }

  // 3. Folio no estaba en ningún lado → upsert mínimo en el nativo (quotes)
  const { record, created } = upsertQuotesEstado(folio, estado);
  res.json({
    success: true,
    folio:   record.folio,
    estado:  record.estado,
    stores:  { quotes: true, checkout: false },
    created, // true si tuvimos que insertar el registro mínimo
  });
});

// ── PATCH /api/quotes/:folio/cancel — cancelación iniciada por el cliente ───
// Sin bindAuth: este endpoint lo llama el frontend del cliente B2B, no Bind.
// (Si en el futuro necesitas auth de cliente real — verificar que el folio le
// pertenece al usuario logueado — agrega un middleware aquí.)
//
// Reglas:
// 1. Folio debe existir en quotesStore u ordersStore.
// 2. Solo se permite cancelar si estado === 'nueva'. Cualquier otro → 409.
// 3. Actualiza el estado a 'cancelada' en el store donde vive.
// 4. Notifica a Bind (fire-and-forget) con el bindFolioId si existe.
router.patch('/:folio/cancel', (req, res) => {
  const folio = req.params.folio;

  // Buscar en ambos stores (siempre, por simetría con el PATCH /status)
  const recordInQuotes   = getQuoteByFolio(folio);
  const recordInCheckout = getOrderByFolio(folio);
  const record = recordInQuotes || recordInCheckout;

  if (!record) {
    return res.status(404).json({ success: false, error: 'Folio no encontrado.' });
  }
  if (record.estado !== 'nueva') {
    return res.status(409).json({
      success: false,
      error:   'No se puede cancelar una solicitud en proceso',
      estado:  record.estado,
    });
  }

  // Actualizar en el store donde vive (puede estar en uno o ambos)
  if (recordInQuotes)   updateQuotesEstado(folio, 'cancelada');
  if (recordInCheckout) updateCheckoutEstado(folio, 'cancelada');

  // Notificar a Bind sin bloquear la respuesta (fire-and-forget).
  // Bind identifica la solicitud por nuestro `folio` (no necesita bindFolioId).
  notifyBindCancellation(folio)
    .catch(err => console.error('[quotes] cancel bind notify:', err.message));

  res.json({ success: true, folio, estado: 'cancelada' });
});

// ── DELETE /api/quotes/:folio/delete — webhook de borrado entrante de Bind ──
// Protegido con bindAuth: lo invoca Bind (ventas borró en su dashboard), no el
// cliente. El cliente solo puede cancelar, nunca borrar.
//
// Idempotente: responde 200 aunque el folio no exista. Borra de AMBOS stores
// (dual-store, como el resto de webhooks) y registra el tombstone en ambos
// servicios para que el GET /:folio responda deleted:true sin importar el tipo.
router.delete('/:folio/delete', bindAuth, (req, res) => {
  const folio = req.params.folio;

  // Dual-store: borra donde viva + tombstone en ambos servicios.
  deleteQuote(folio);
  deleteOrder(folio);

  res.json({ success: true, folio, deleted: true });
});

export default router;
