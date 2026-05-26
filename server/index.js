import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path    from 'node:path';
import { fileURLToPath } from 'node:url';

import chatRouter     from './routes/chat.js';
import quotesRouter   from './routes/quotes.js';
import contactRouter  from './routes/contact.js';
import checkoutRouter from './routes/checkout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Bind-Key', 'X-API-Key'],
}));

// 5MB para soportar logos en base64 (data URLs)
app.use(express.json({ limit: '5mb' }));

// ── Estáticos: logos guardados en /server/uploads/ ───────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/chat',     chatRouter);
app.use('/api/quotes',   quotesRouter);
app.use('/api/contact',  contactRouter);
app.use('/api/checkout', checkoutRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Arrancar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Plastitaps API server → http://localhost:${PORT}`);
  console.log(`   POST  /api/chat                       — Chatbot`);
  console.log(`   POST  /api/quotes                     — Cotizaciones personalizadas`);
  console.log(`   GET   /api/quotes/:folio              — Estado actual (polling)`);
  console.log(`   PATCH /api/quotes/:folio/status       — Webhook Bind (X-Bind-Key)`);
  console.log(`   POST  /api/contact                    — Formulario de contacto`);
  console.log(`   POST  /api/checkout/send              — Checkout industrial`);
  console.log(`   GET   /api/checkout/:folio            — Estado actual (polling)`);
  console.log(`   PATCH /api/checkout/:folio/status     — Webhook Bind (X-Bind-Key)`);
  console.log(`   GET   /uploads/<folio>.<ext>          — Logos servidos estáticamente`);
  console.log(`   GET   /api/health                     — Health check\n`);

  if (!process.env.OPENAI_API_KEY)     console.warn('⚠️  OPENAI_API_KEY no definida — chatbot desactivado.');
  if (!process.env.SMTP_HOST)          console.warn('⚠️  SMTP_HOST no definida — emails desactivados.');
  if (!process.env.BIND_INCOMING_KEY)  console.warn('⚠️  BIND_INCOMING_KEY no definida — webhook entrante rechazará todo.');
});
