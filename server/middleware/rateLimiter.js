import rateLimit from 'express-rate-limit';

// Límite general: 30 requests por minuto por IP
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes. Espera un momento antes de enviar otro mensaje.',
  },
});
