import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiTrash2, FiFileText, FiShoppingBag, FiInfo
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const fmtN = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0).toLocaleString('es-MX');

function CartItem({ item, onRemove }) {
  return (
    <div className="rounded-2xl p-4 border bg-slate-50 border-slate-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.name}</h4>
          {item.category && (
            <p className="text-[11px] text-slate-400 mt-0.5">{item.category}</p>
          )}
        </div>
        <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <FiTrash2 className="text-sm" />
        </button>
      </div>
    </div>
  );
}

export default function Cart() {
  const {
    cart,
    isCartOpen, setIsCartOpen,
    removeFromCart, clearCart,
    totalItems,
  } = useCart();

  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Prevent background scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  // Close cart on Escape key
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setIsCartOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCartOpen, setIsCartOpen]);

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)} />

            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="font-black font-outfit text-xl text-slate-900 flex items-center gap-2">
                    <FiFileText className="text-blue-600" /> Mi Cotización
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {fmtN(totalItems)} producto(s) seleccionado(s)
                  </p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <FiShoppingBag className="text-5xl mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-sm">Tu cotización está vacía.</p>
                    <p className="text-xs mt-1">Agrega los productos de tu interés para solicitar tu cotización.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <CartItem key={item.id} item={item} onRemove={removeFromCart} />
                  ))
                )}
              </div>

              {/* Footer CTAs */}
              {cart.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-5 space-y-3 bg-slate-50">

                  <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                    <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5">
                      <FiFileText /> Solicitar Cotización
                    </button>
                  </Link>

                  {/* Botón de Vaciar */}
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="w-full py-3 bg-white border-2 border-slate-200 text-slate-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <FiTrash2 className="text-lg" /> Vaciar
                  </button>

                  {/* Leyenda de asesoría */}
                  <div className="mt-2 bg-slate-100 rounded-xl p-3 flex gap-2.5 items-start border border-slate-200">
                    <FiInfo className="text-blue-500 mt-0.5 shrink-0 text-sm" />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Cantidades, personalización y envío se definen con el personal de Plastitaps, que se pondrá en contacto contigo.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmación para Vaciar */}
              <AnimatePresence>
                {showConfirmClear && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center border border-slate-100"
                    >
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiTrash2 className="text-2xl" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2 font-outfit">Vaciar Cotización</h3>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        ¿Estás seguro de que deseas eliminar todos los productos de tu cotización? Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-3">
                        <button onClick={() => setShowConfirmClear(false)}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => { clearCart(); setShowConfirmClear(false); }}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30">
                          Sí, Vaciar
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
