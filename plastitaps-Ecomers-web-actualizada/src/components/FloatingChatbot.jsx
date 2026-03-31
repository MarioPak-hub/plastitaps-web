import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMinimize2,
} from 'react-icons/fi';

// ── Catálogos de productos (importados estáticamente desde Vite) ──────────────
import products from '../data/products.json';
import retailProducts from '../data/retail_products.json';
import promoCatalog from '../data/promo_catalog.json';

// ── Construcción dinámica del contexto del sistema ────────────────────────────
function buildSystemPrompt() {
  const all = [
    ...products.map((p) => ({
      name: p.name,
      category: p.category ?? 'General',
      price: p.price,
      moq: p.moq,
      unit: p.unit,
      description: p.description,
    })),
    ...retailProducts.map((p) => ({
      name: p.name,
      category: 'Retail',
      price: p.price,
      moq: p.moq ?? 1,
      unit: p.unit,
      description: p.description,
    })),
    ...promoCatalog.map((p) => ({
      name: p.name,
      category: 'Promocionales',
      price: p.price,
      moq: p.moq ?? 10,
      unit: p.unit,
      description: p.description,
    })),
  ];

  const productList = all
    .map(
      (p) =>
        `• ${p.name} [${p.category}] — $${Number(p.price).toFixed(2)} MXN + IVA | MOQ: ${p.moq} ${p.unit}. ${p.description}`
    )
    .join('\n');

  return `Eres el asistente virtual de ventas exclusivo de Plastitaps, una empresa mexicana especializada en tapas, vasos, botellas y envases plásticos de alta calidad.

Aquí tienes la lista COMPLETA y OFICIAL de nuestros productos reales:
${productList}

REGLAS ESTRICTAS QUE DEBES SEGUIR SIN EXCEPCIÓN:
1. TU ÚNICA TAREA es ayudar a los clientes a comprar, cotizar y resolver dudas sobre los productos listados arriba.
2. NO inventes productos, características, precios ni especificaciones que NO estén en la lista.
3. Si un cliente pregunta por un producto que no está en la lista, responde: "Lo siento, ese producto no está disponible en nuestro catálogo actual. ¿Puedo ayudarte a encontrar una alternativa entre nuestros productos disponibles?"
4. Si el usuario hace una pregunta completamente fuera de tema (recetas, historia, entretenimiento, política, etc.), responde amablemente: "Solo estoy configurado para ayudarte con los productos y servicios de Plastitaps. ¿Tienes alguna duda sobre nuestro catálogo?"
5. Responde siempre en español, de forma amable, profesional y concisa.
6. Cuando menciones precios, recuerda al cliente que son precios + IVA y que aplican según cantidad mínima de pedido (MOQ).
7. Puedes orientar al cliente hacia productos alternativos del catálogo cuando sea útil.`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

// ── Componente de indicador "Escribiendo..." ──────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        P
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-slate-400 rounded-full block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          P
        </div>
      )}

      {/* Burbuja */}
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
            : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy el asistente virtual de Plastitaps 👋\nEstoy aquí para ayudarte a encontrar tapas, vasos, botellas y más. ¿En qué te puedo ayudar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Foco en el input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      // 🔍 DEBUG: muestra todas las variables de entorno que Vite cargó
      console.log('Variables de entorno (import.meta.env):', import.meta.env);

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'No se encontró VITE_OPENAI_API_KEY en el entorno. ' +
          'Abre el archivo .env, pon tu key real (sk-...) y reinicia el servidor Vite.'
        );
      }

      // Usamos el proxy de Vite (/api/openai) para evitar bloqueos CORS del navegador.
      // En producción deberías usar un backend/serverless function.
      const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 400,
          temperature: 0.4,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || `Error HTTP ${response.status}`;
        throw new Error(errMsg);
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // Log detallado en la consola del navegador (F12)
      console.error('❌ Detalle del error fetch:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error al conectar con el asistente: ${err.message}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Ventana de chat ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  P
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Asistente Plastitaps</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full block animate-pulse" />
                    <span className="text-green-400 text-xs">En línea</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
                aria-label="Cerrar chat"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 space-y-0.5">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-100 px-3 py-3 flex items-end gap-2 flex-shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all leading-snug max-h-24 overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                aria-label="Enviar mensaje"
              >
                <FiSend size={16} />
              </button>
            </div>

            {/* Footer disclaimer */}
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex-shrink-0">
              <p className="text-center text-[10px] text-slate-400">
                Precios + IVA · Solo productos del catálogo Plastitaps
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante ────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-blue-500/40 flex items-center justify-center transition-colors"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente virtual'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiMinimize2 size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FiMessageSquare size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulso de atención (solo cuando el chat está cerrado) */}
      {!isOpen && (
        <span className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 opacity-40 animate-ping pointer-events-none" />
      )}
    </>
  );
}
