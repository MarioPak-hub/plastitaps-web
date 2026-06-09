import rateLimit from 'express-rate-limit';

// Chatbot: 30 req/min
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento antes de enviar otro mensaje.' },
});

// Cotizaciones: 20 req/15 min
export const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas cotizaciones. Intenta más tarde.' },
});

// Formulario de contacto: 5 req/15 min
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes enviados. Intenta en unos minutos.' },
});

// Checkout: 10 req/15 min
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de pedido. Intenta más tarde.' },
});
