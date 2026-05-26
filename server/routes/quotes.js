import { Router } from 'express';
import { quoteLimiter } from '../middleware/rateLimiter.js';
import { buildQuotePayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { saveQuote, notifyVentas, sendToBind } from '../services/quotesService.js';

const router = Router();

router.post('/', quoteLimiter, async (req, res) => {
  try {
    const { cliente, productos, logoUrl, pdfUrl, observaciones, tipo } = req.body;

    if (!cliente?.email) {
      return res.status(400).json({ success: false, error: 'Email del cliente requerido.' });
    }

    const folio   = generateFolio();
    const payload = buildQuotePayload({ folio, tipo, cliente, productos, logoUrl, pdfUrl, observaciones });

    saveQuote(payload);

    notifyVentas(payload).catch(err => console.error('[quotes] email:', err.message));
    sendToBind(payload).catch(err => console.error('[quotes] bind:', err.message));

    res.json({ success: true, folio, record: payload });
  } catch (err) {
    console.error('[quotes] error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar la cotización.' });
  }
});

export default router;
