import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter     from './routes/chat.js';
import quotesRouter   from './routes/quotes.js';
import contactRouter  from './routes/contact.js';
import checkoutRouter from './routes/checkout.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(express.json({ limit: '2mb' })); // 2MB para soportar logos en base64 si fuera necesario

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
  console.log(`   POST /api/chat            — Chatbot`);
  console.log(`   POST /api/quotes          — Cotizaciones personalizadas`);
  console.log(`   POST /api/contact         — Formulario de contacto`);
  console.log(`   POST /api/checkout/send   — Checkout industrial`);
  console.log(`   GET  /api/health          — Health check\n`);

  if (!process.env.OPENAI_API_KEY) console.warn('⚠️  OPENAI_API_KEY no definida — chatbot desactivado.');
  if (!process.env.SMTP_HOST)      console.warn('⚠️  SMTP_HOST no definida — emails desactivados.');
});
