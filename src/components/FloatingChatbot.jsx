import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiMessageSquare,
  FiX,
  FiSend,
  FiMinimize2,
  FiShoppingBag,
  FiChevronRight,
  FiMessageCircle,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../utils/apiFetch';

// ── Indicador "Escribiendo..." ────────────────────────────────────────────────
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

// ── Tarjeta de producto clickeable ────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(product)}
      className="flex items-center gap-3 w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-blue-400 hover:shadow-md transition-all text-left group cursor-pointer"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
        <FiShoppingBag size={16} className="text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
          {product.name}
        </p>
        {product.category && (
          <p className="text-xs text-blue-600 font-medium truncate">
            {product.category}
          </p>
        )}
      </div>
      <FiChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </motion.button>
  );
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ message, onProductClick }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          P
        </div>
      )}

      <div className={`max-w-[80%] flex flex-col gap-2`}>
        {/* Texto del mensaje */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>

        {/* Tarjetas de productos (solo en mensajes del asistente) */}
        {!isUser && message.products?.length > 0 && (
          <div className="flex flex-col gap-1.5 pl-1">
            {message.products.map((product, idx) => (
              <ProductCard
                key={`${product.slug}-${idx}`}
                product={product}
                onClick={onProductClick}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FloatingChatbot({ onProductClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isCartOpen } = useCart();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asesor de Plastitaps 👋\n¿Qué tipo de producto estás buscando? Tenemos tapas, vasos, botellas y envases.',
      products: [],
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

  // Abrir modal global al clickear producto
  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product.slug);
    }
    setIsOpen(false);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { role: 'user', content: trimmed, products: [] };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          products: data.products || [],
        },
      ]);
    } catch (err) {
      console.error('Error en chatbot:', err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Error al conectar con el asistente. Intenta de nuevo.'}`,
          products: [],
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
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
            style={{ height: '540px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30">
                  P
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Asesor Plastitaps</p>
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
                id="chatbot-close-btn"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto bg-white px-4 py-4 space-y-0.5">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  message={msg}
                  onProductClick={handleProductClick}
                />
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
                id="chatbot-input"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                aria-label="Enviar mensaje"
                id="chatbot-send-btn"
              >
                <FiSend size={16} />
              </button>
            </div>

            {/* Footer disclaimer */}
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex-shrink-0">
              <p className="text-center text-[10px] text-slate-400">
                Haz clic en un producto para verlo en el catálogo
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante de WhatsApp (arriba del chatbot, oculto si el chat está abierto) ── */}
      {!isCartOpen && !isOpen && (
        <motion.a
          href="https://wa.me/5233259625?text=Hola%20Plastitaps,%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n."
          target="_blank"
          rel="noreferrer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-full shadow-lg hover:shadow-[#25D366]/40 flex items-center justify-center transition-colors"
          aria-label="Chatear por WhatsApp"
          id="whatsapp-float-btn"
        >
          <FiMessageCircle size={24} />
        </motion.a>
      )}

      {/* ── Botón flotante (hidden when cart is open) ───────────────────── */}
      {!isCartOpen && (
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-blue-500/40 flex items-center justify-center transition-colors"
          aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente virtual'}
          id="chatbot-toggle-btn"
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
      )}

      {/* Pulso de atención (solo cuando el chat está cerrado y carrito no abierto) */}
      {!isOpen && !isCartOpen && (
        <span className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 opacity-40 animate-ping pointer-events-none" />
      )}
    </>
  );
}
