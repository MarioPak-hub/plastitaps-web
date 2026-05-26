import { Router } from 'express';
import { checkoutLimiter } from '../middleware/rateLimiter.js';
import { buildCheckoutPayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { saveOrder, sendOrderEmail, sendToBind } from '../services/checkoutService.js';

const router = Router();

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

export default router;
