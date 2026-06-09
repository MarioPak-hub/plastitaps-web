import { Router } from 'express';
import { quoteLimiter } from '../middleware/rateLimiter.js';
import { buildQuotePayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { saveLogoBase64 } from '../utils/logoStorage.js';
import {
  saveQuote, getQuoteByFolio,
  updateEstado as updateQuotesEstado,
  notifyVentas,
} from '../services/quotesService.js';
// Cross-store: el cliente puede cancelar un folio que vive en el otro store
// (los pedidos industriales viven en ordersStore). Operamos en ambos por simetría.
import {
  updateEstado as updateCheckoutEstado,
  getOrderByFolio,
} from '../services/checkoutService.js';

const router = Router();

// ── POST /api/quotes — registrar cotización personalizada ────────────────────
// Guarda el folio en el store local y notifica a ventas por correo. Sin más.
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

    res.json({ success: true, folio, record: payload });
  } catch (err) {
    console.error('[quotes] error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar la cotización.' });
  }
});

// ── PATCH /api/quotes/:folio/cancel — cancelación iniciada por el cliente ───
// El cliente solo puede cancelar si la solicitud sigue en estado 'nueva'.
// Actualiza el estado a 'cancelada' en el store donde viva.
router.patch('/:folio/cancel', (req, res) => {
  const folio = req.params.folio;

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

  if (recordInQuotes)   updateQuotesEstado(folio, 'cancelada');
  if (recordInCheckout) updateCheckoutEstado(folio, 'cancelada');

  res.json({ success: true, folio, estado: 'cancelada' });
});

export default router;
