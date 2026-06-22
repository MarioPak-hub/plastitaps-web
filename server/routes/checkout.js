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

    // El pedido ya quedó guardado — no bloqueamos la respuesta al cliente
    // esperando al correo (mismo patrón que /api/quotes).
    sendOrderEmail(payload).catch(err => console.error('[checkout] email:', err.message));

    res.json({ success: true, folio, cancelToken: payload.cancelToken, record: payload });
  } catch (err) {
    console.error('[checkout] error:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el pedido. Intenta de nuevo.' });
  }
});

// ── PATCH /api/checkout/:folio/cancel — cancelación iniciada por el cliente ─
// Vuln-fix 4: requiere X-Cancel-Token igual al generado al crear el pedido.
router.patch('/:folio/cancel', (req, res) => {
  const folio       = req.params.folio;
  const clientToken = req.headers['x-cancel-token'];

  const recordInCheckout = getOrderByFolio(folio);
  const recordInQuotes   = getQuoteByFolio(folio);
  const record = recordInCheckout || recordInQuotes;

  if (!record) {
    return res.status(404).json({ success: false, error: 'Folio no encontrado.' });
  }

  if (!clientToken || clientToken !== record.cancelToken) {
    return res.status(403).json({ success: false, error: 'No autorizado.' });
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
