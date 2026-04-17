import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['POST'],
}));

// Limitar tamaño de body a 50KB (prevenir abuso)
app.use(express.json({ limit: '50kb' }));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Plastitaps API server running on http://localhost:${PORT}`);
  console.log(`   POST /api/chat  — Chatbot endpoint`);
  console.log(`   GET  /api/health — Health check\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY no está definida en .env — el chatbot NO funcionará.');
  }
});
