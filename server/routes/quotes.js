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

    // Si llega base64, lo guardamos en /server/uploads/ y usamos esa ruta como logoUrl.
    const savedLogoUrl = logoBase64
      ? saveLogoBase64(folio, logoBase64, logoExt)
      : null;

    // Vuln-fix 5: solo aceptar logoUrl con esquema http(s) o ruta interna /uploads/.
    // Rechazamos javascript:, data:, vbscript: y cualquier otro esquema peligroso.
    const rawLogoUrl  = savedLogoUrl || logoUrl || null;
    const safeLogoUrl = rawLogoUrl && /^(https?:\/\/|\/uploads\/)/.test(rawLogoUrl)
      ? rawLogoUrl
      : null;

    const payload = buildQuotePayload({
      folio,
      tipo,
      cliente,
      productos,
      logoUrl: safeLogoUrl,
      pdfUrl,
      observaciones,
    });

    saveQuote(payload);

    notifyVentas(payload).catch(err => console.error('[quotes] email:', err.message));

    // El cancelToken se devuelve al cliente para autenticar futuras cancelaciones.
    // El record que va a Firestore (guardado en el frontend) NO debe incluirlo en
    // campos visibles — el frontend lo guarda aparte (ej. localStorage) y lo envía
    // en el header X-Cancel-Token al cancelar.
    res.json({ success: true, folio, cancelToken: payload.cancelToken, record: payload });
  } catch (err) {
    console.error('[quotes] error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar la cotización.' });
  }
});

// ── PATCH /api/quotes/:folio/cancel — cancelación iniciada por el cliente ───
// Vuln-fix 4: requiere X-Cancel-Token (el token secreto generado al crear el
// folio y devuelto solo en la respuesta del POST). Sin él cualquier atacante
// podría cancelar pedidos ajenos adivinando/enumerando el folio.
router.patch('/:folio/cancel', (req, res) => {
  const folio       = req.params.folio;
  const clientToken = req.headers['x-cancel-token'];

  const recordInQuotes   = getQuoteByFolio(folio);
  const recordInCheckout = getOrderByFolio(folio);
  const record = recordInQuotes || recordInCheckout;

  if (!record) {
    return res.status(404).json({ success: false, error: 'Folio no encontrado.' });
  }

  // Verificar token antes de revelar el estado del folio (evita oracle de enumeración)
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

  if (recordInQuotes)   updateQuotesEstado(folio, 'cancelada');
  if (recordInCheckout) updateCheckoutEstado(folio, 'cancelada');

  res.json({ success: true, folio, estado: 'cancelada' });
});

export default router;
