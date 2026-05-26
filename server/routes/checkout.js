import { Router } from 'express';
import { checkoutLimiter } from '../middleware/rateLimiter.js';
import { buildCheckoutPayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { bindAuth } from '../middleware/bindAuth.js';
import {
  saveOrder, getOrderByFolio, updateEstado,
  sendOrderEmail, sendToBind,
} from '../services/checkoutService.js';

const router = Router();

// ── POST /api/checkout/send — enviar cotización industrial ──────────────────
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
    sendToBind(payload).catch(err => console.error('[checkout] bind:', err.message));

    res.json({ success: true, folio, record: payload });
  } catch (err) {
    console.error('[checkout] error:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el pedido. Intenta de nuevo.' });
  }
});

// ── GET /api/checkout/:folio — polling de estado actual ─────────────────────
router.get('/:folio', (req, res) => {
  const record = getOrderByFolio(req.params.folio);
  if (!record) return res.status(404).json({ success: false, error: 'No encontrado.' });
  res.json({ success: true, record });
});

// ── PATCH /api/checkout/:folio/status — webhook entrante de Bind ────────────
router.patch('/:folio/status', bindAuth, (req, res) => {
  const { estado } = req.body || {};
  if (!estado || typeof estado !== 'string') {
    return res.status(400).json({ success: false, error: 'Campo `estado` requerido.' });
  }

  const updated = updateEstado(req.params.folio, estado);
  if (!updated) return res.status(404).json({ success: false, error: 'Folio no encontrado.' });

  res.json({ success: true, folio: req.params.folio, estado });
});

export default router;
