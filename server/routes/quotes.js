import { Router } from 'express';
import { quoteLimiter } from '../middleware/rateLimiter.js';
import { buildQuotePayload } from '../utils/payloadBuilder.js';
import { generateFolio } from '../utils/folioGenerator.js';
import { saveLogoBase64 } from '../utils/logoStorage.js';
import { bindAuth } from '../middleware/bindAuth.js';
import {
  saveQuote, getQuoteByFolio, updateEstado,
  notifyVentas, sendToBind,
} from '../services/quotesService.js';

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
    sendToBind(payload).catch(err => console.error('[quotes] bind:', err.message));

    res.json({ success: true, folio, record: payload });
  } catch (err) {
    console.error('[quotes] error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar la cotización.' });
  }
});

// ── GET /api/quotes/:folio — polling del estado actual desde el frontend ────
router.get('/:folio', (req, res) => {
  const record = getQuoteByFolio(req.params.folio);
  if (!record) return res.status(404).json({ success: false, error: 'No encontrado.' });
  res.json({ success: true, record });
});

// ── PATCH /api/quotes/:folio/status — webhook entrante de Bind ──────────────
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
