import { Router } from 'express';
import OpenAI from 'openai';
import { buildSystemPrompt } from '../config/systemPrompt.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const openai = new OpenAI();

// Construir el system prompt una vez al arrancar
const SYSTEM_PROMPT = buildSystemPrompt();

// ── Validación y sanitización ────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 20;
const ALLOWED_ROLES = ['user', 'assistant'];

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return null;

  const cleaned = [];
  for (const msg of messages.slice(-MAX_HISTORY_MESSAGES)) {
    if (
      typeof msg?.role !== 'string' ||
      typeof msg?.content !== 'string' ||
      !ALLOWED_ROLES.includes(msg.role)
    ) {
      continue;
    }
    cleaned.push({
      role: msg.role,
      content: msg.content.slice(0, MAX_MESSAGE_LENGTH).trim(),
    });
  }
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Intenta parsear el JSON que devuelve OpenAI.
 * Si falla, devuelve un objeto con mensaje plano y products vacío.
 */
function parseAssistantResponse(raw) {
  // Limpiar posibles envolturas markdown ```json ... ```
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validar estructura
    if (typeof parsed.message !== 'string') {
      return { message: raw, products: [] };
    }

    // Validar y limpiar products
    const products = Array.isArray(parsed.products)
      ? parsed.products
          .filter(
            (p) =>
              typeof p?.name === 'string' &&
              typeof p?.slug === 'string'
          )
          .slice(0, 3) // Máximo 3
          .map((p) => ({
            name: p.name,
            slug: p.slug,
            price: typeof p.price === 'string' ? p.price : `$${p.price}`,
          }))
      : [];

    return { message: parsed.message, products };
  } catch {
    // Si no es JSON válido, devolver como texto plano
    return { message: raw, products: [] };
  }
}

// ── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/', chatLimiter, async (req, res) => {
  try {
    const messages = sanitizeMessages(req.body?.messages);

    if (!messages) {
      return res.status(400).json({
        message: 'Se requiere un array de mensajes válido.',
        products: [],
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    const parsed = parseAssistantResponse(rawContent);
    res.json(parsed);
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);

    if (error?.status === 401) {
      return res.status(500).json({
        message: 'Error de configuración del servidor.',
        products: [],
      });
    }
    if (error?.status === 429) {
      return res.status(429).json({
        message: 'El servicio está saturado. Intenta en unos segundos.',
        products: [],
      });
    }

    res.status(500).json({
      message: 'Error al procesar tu mensaje. Intenta de nuevo.',
      products: [],
    });
  }
});

export default router;
