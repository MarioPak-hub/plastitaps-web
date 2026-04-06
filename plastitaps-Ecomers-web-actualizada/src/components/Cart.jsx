import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiTrash2, FiFileText, FiAlertTriangle,
  FiCreditCard, FiAlertCircle, FiShoppingBag,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const fmtN   = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0).toLocaleString('es-MX');
const fmtMXN = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const fmt4   = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0).toLocaleString('es-MX', { minimumFractionDigits: 4 });

function CartItem({ item, onQtyChange, onRemove }) {
  const isItemPromo = String(item.id).startsWith('pc');
  return (
    <div className={`rounded-2xl p-4 border ${isItemPromo ? 'bg-blue-50/60 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-bold text-slate-800 text-sm leading-snug">{item.name}</h4>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${isItemPromo ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>
              {isItemPromo ? 'STRIPE' : 'PDF'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">${fmt4(item.price)} / {item.unit || 'pz'}{item.moq > 1 ? ` · MOQ: ${fmtN(item.moq)}` : ''}</p>
        </div>
        <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <FiTrash2 className="text-sm" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <input
          type="number"
          min={item.moq || 1}
          step={item.moq > 10 ? item.moq : 10}
          value={item.quantity || 1}
          onChange={e => onQtyChange(item.id, parseInt(e.target.value) || item.moq || 1)}
          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
        />
        <p className="text-sm font-black text-blue-700">${fmtMXN((item.quantity || 0) * (item.price || 0))}</p>
      </div>
    </div>
  );
}

export default function Cart() {
  const {
    cart, promoItems, industrialItems, cartType,
    isCartOpen, setIsCartOpen,
    removeFromCart, updateQuantity, clearCart,
    totalItems, promoTotal, industrialTotal,
    moqError,
  } = useCart();

  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Cerrar con tecla Escape (accesibilidad)
  useEffect(() => {
    if (!isCartOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
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
                    <FiShoppingBag className="text-blue-600" /> Mi Carrito
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {fmtN(totalItems)} unidades · {cart.length} producto(s)
                    {cartType === 'mixed' && <span className="text-amber-600 font-bold ml-1">· Mixto</span>}
                  </p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* MOQ error toast */}
              <AnimatePresence>
                {moqError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mx-4 mt-3 bg-red-600 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                    <FiAlertTriangle /> Mínimo {fmtN(moqError.moq)} {moqError.unit} · {moqError.name}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mixed cart warning */}
              {cartType === 'mixed' && (
                <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700 font-medium">
                  <FiAlertCircle className="text-base flex-shrink-0 mt-0.5" />
                  Tienes productos promocionales y de catálogo industrial. Se procesan por separado.
                </div>
              )}

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <FiShoppingBag className="text-5xl mx-auto mb-4 opacity-30" />
                    <p className="font-medium text-sm">Carrito vacío.</p>
                    <p className="text-xs mt-1">Agrega vasos promocionales o solicita una cotización industrial.</p>
                  </div>
                ) : (
                  <>
                    {/* ── Promo section ── */}
                    {promoItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-blue-600 text-white rounded-full">💳 Pago con Stripe</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        {promoItems.map(item => (
                          <CartItem key={item.id} item={item} onQtyChange={updateQuantity} onRemove={removeFromCart} />
                        ))}
                      </div>
                    )}

                    {/* ── Industrial section ── */}
                    {industrialItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-slate-700 text-white rounded-full">📄 Cotización PDF</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        {industrialItems.map(item => (
                          <CartItem key={item.id} item={item} onQtyChange={updateQuantity} onRemove={removeFromCart} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer CTAs */}
              {cart.length > 0 && (
                <div className="border-t border-slate-200 px-5 py-5 space-y-3 bg-slate-50">

                  {/* Promo subtotal + Stripe CTA */}
                  {promoItems.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm text-slate-500"><span>Promocionales</span><span>${fmtMXN(promoTotal)}</span></div>
                      <div className="flex justify-between text-sm text-slate-500"><span>IVA 16%</span><span>${fmtMXN(promoTotal * 0.16)}</span></div>
                      <div className="flex justify-between font-black text-blue-700 text-lg"><span>Total</span><span>${fmtMXN(promoTotal * 1.16)}</span></div>
                      <Link to="/carrito" onClick={() => setIsCartOpen(false)}>
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5 mt-1">
                          <FiCreditCard /> Pagar Promocionales con Stripe
                        </button>
                      </Link>
                    </div>
                  )}

                  {/* Industrial CTA */}
                  {industrialItems.length > 0 && (
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between font-black text-slate-900 text-lg"><span>Industrial</span><span>${fmtMXN(industrialTotal)} MXN</span></div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-700 font-medium flex items-center gap-1.5">
                        <FiAlertCircle /> MXN + IVA · Sin envío ZMG · 50% anticipo
                      </div>
                      <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                        <button className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 mt-1">
                          <FiFileText /> Generar Cotización PDF
                        </button>
                      </Link>
                    </div>
                  )}

                  {/* Botón de Vaciar Carrito */}
                  <div className="pt-2">
                    <button 
                      onClick={() => setShowConfirmClear(true)}
                      className="w-full py-3 bg-white border-2 border-slate-200 text-slate-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <FiTrash2 className="text-lg" /> Vaciar Carrito
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmación para Vaciar Carrito */}
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
                      <h3 className="text-xl font-black text-slate-900 mb-2 font-outfit">Vaciar Carrito</h3>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        ¿Estás seguro de que deseas eliminar todos los artículos del carrito? Esta acción no se puede deshacer.
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
