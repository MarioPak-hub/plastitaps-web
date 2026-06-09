import { Router } from 'express';
import { checkoutLimiter } from '../middleware/rateLimiter.js';
import { buildCheckoutPayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import {
  saveOrder, getOrderByFolio,
  updateEstado as updateCheckoutEstado,
  sendOrderEmail,
} from '../services/checkoutService.js';
// Cross-store: el cliente puede cancelar un folio que vive en el otro store.
import {
  updateEstado as updateQuotesEstado,
  getQuoteByFolio,
} from '../services/quotesService.js';

const router = Router();

// ── POST /api/checkout/send — enviar cotización industrial ──────────────────
// Guarda el folio y notifica a ventas por correo. Sin más.
router.post('/send', checkoutLimiter, async (req, res) => {
  try {
    const { cliente, productos, totalPrice, totalIVA } = req.body;

    if (!cliente?.email || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ success: false, error: 'Datos del pedido incompletos.' });
    }

    const folio   = generateFolio();
    const payload = buildCheckoutPayload({ folio, cliente, productos, totalPrice, totalIVA });

    saveOrder(payload);

    await sendOrderEmail(payload);

    res.json({ success: true, folio, record: payload });
  } catch (err) {
    console.error('[checkout] error:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el pedido. Intenta de nuevo.' });
  }
});

// ── PATCH /api/checkout/:folio/cancel — cancelación iniciada por el cliente ─
// El cliente solo puede cancelar si la solicitud sigue en estado 'nueva'.
router.patch('/:folio/cancel', (req, res) => {
  const folio = req.params.folio;

  const recordInCheckout = getOrderByFolio(folio);
  const recordInQuotes   = getQuoteByFolio(folio);
  const record = recordInCheckout || recordInQuotes;

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

  if (recordInCheckout) updateCheckoutEstado(folio, 'cancelada');
  if (recordInQuotes)   updateQuotesEstado(folio, 'cancelada');

  res.json({ success: true, folio, estado: 'cancelada' });
});

export default router;
