import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiShield, FiPlus, FiMinus, FiAlertCircle, FiCheckCircle, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import retailProducts from '../data/retail_products.json';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const fmtMXN = (n) => (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const fmtU = (n) => (n || 0).toLocaleString('es-MX');

// ── Stripe payment form ──────────────────────────────────────────────────────
function PromoCheckoutForm({ total }) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus('loading');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/pago-exitoso` },
    });
    if (error) { setStatus('error'); setErrMsg(error.message); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
          <FiAlertCircle /> {errMsg}
        </div>
      )}
      <button type="submit" disabled={!stripe || status === 'loading'}
        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl
          ${status === 'loading' ? 'bg-blue-400 text-white cursor-wait' : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1'}`}>
        <FiCreditCard />
        {status === 'loading' ? 'Procesando pago...' : `Comprar Ahora · $${fmtMXN(total)} MXN`}
      </button>
    </form>
  );
}

// ── Main Promocionales page ──────────────────────────────────────────────────
export default function Promocionales() {
  // lineItems: { [productId]: { ...product, qty } }
  const [lineItems, setLineItems] = useState({});
  const [inCheckout, setInCheckout] = useState(false);

  // Click card → add at qty=1; click again → remove
  const toggleProduct = (product) => {
    setLineItems(prev => {
      if (prev[product.id]) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { ...product, qty: 1 } };
    });
  };

  const setQty = (id, qty) => {
    if (qty < 1) {
      setLineItems(prev => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    setLineItems(prev => ({ ...prev, [id]: { ...prev[id], qty } }));
  };

  const setPackQty = (product, pack) => {
    setLineItems(prev => ({ ...prev, [product.id]: { ...product, qty: pack } }));
  };

  const activeItems = Object.values(lineItems);
  const subtotal = activeItems.reduce((a, i) => a + i.qty * i.price, 0);
  const totalIVA = subtotal * 1.16;

  const stripeOptions = {
    mode: 'payment',
    amount: Math.max(50, Math.round(totalIVA * 100)),
    currency: 'mxn',
    appearance: {
      theme: 'stripe',
      variables: { colorPrimary: '#2563eb', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' },
    },
  };

  return (
    <div className="min-h-screen bg-white font-inter text-slate-800">
      <Navbar />

      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5">
            <FiShoppingBag /> Tienda Retail · Pago Inmediato
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900 mb-3">
            Vasos <span className="text-blue-600">Promocionales</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Sin mínimos industriales. Compra desde 1 pieza. Pago seguro con tarjeta.
          </p>
        </div>

        {!inCheckout ? (
          <>
            {/* Product grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {retailProducts.map(p => {
                const selected = !!lineItems[p.id];
                const item = lineItems[p.id];

                return (
                  <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
                    {/* Card header — clicking toggles selection */}
                    <div
                      onClick={() => toggleProduct(p)}
                      className={`cursor-pointer rounded-3xl border-2 overflow-hidden transition-all ${selected
                        ? 'border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md shadow-sm'
                        }`}>

                      {/* Image */}
                      <div className="bg-slate-50 flex items-center justify-center p-6 h-44 relative">
                        <span className="absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">{p.badge}</span>
                        <img src={p.image} alt={p.name} className="h-32 object-contain" style={{ filter: p.filter }} />
                        <div className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {selected && <FiCheckCircle className="text-white text-sm" />}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 bg-white">
                        <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{p.name}</h3>
                        <p className="text-xs text-slate-400 mb-4">{p.description}</p>

                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex justify-between items-center mb-4">
                          <span className="text-xs text-slate-500 font-medium">Precio unitario</span>
                          <span className="font-black text-blue-700 text-xl">${fmtMXN(p.price)} <span className="text-xs font-normal text-slate-400">MXN</span></span>
                        </div>

                        {/* Quick packs */}
                        <div className="flex gap-2">
                          {p.packOptions.map(pack => (
                            <button key={pack}
                              onClick={e => { e.stopPropagation(); setPackQty(p, pack); }}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${selected && item?.qty === pack
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                                }`}>
                              {fmtU(pack)} {p.unit}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Qty adjuster — shown when selected */}
                    <AnimatePresence>
                      {selected && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden">
                          <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-200">
                            <button onClick={() => setQty(p.id, (item?.qty || 1) - 1)}
                              className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm">
                              <FiMinus className="text-sm" />
                            </button>
                            <span className="flex-1 text-center font-black text-blue-800 text-lg">
                              {fmtU(item?.qty || 1)} <span className="text-sm font-normal text-slate-400">{p.unit}</span>
                            </span>
                            <button onClick={() => setQty(p.id, (item?.qty || 1) + 1)}
                              className="w-9 h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm">
                              <FiPlus className="text-sm" />
                            </button>
                            <button onClick={() => toggleProduct(p)}
                              className="w-9 h-9 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm">
                              <FiTrash2 className="text-sm" />
                            </button>
                            <span className="font-bold text-blue-700 text-sm whitespace-nowrap">
                              ${fmtMXN((item?.qty || 1) * p.price)}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary + CTA */}
            <AnimatePresence>
              {activeItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="bg-blue-700 rounded-3xl p-6 text-white space-y-4">
                  <div className="space-y-1">
                    {activeItems.map(i => (
                      <div key={i.id} className="flex justify-between text-sm text-blue-200">
                        <span>{i.name} × {fmtU(i.qty)} {i.unit}</span>
                        <span className="font-bold">${fmtMXN(i.qty * i.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-blue-300 text-sm pt-1 border-t border-blue-600">
                      <span>IVA 16%</span><span>${fmtMXN(subtotal * 0.16)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-xs">Total a pagar (con IVA)</p>
                      <p className="font-black text-3xl font-outfit">${fmtMXN(totalIVA)} MXN</p>
                    </div>
                    <FiShield className="text-5xl text-blue-300 opacity-60" />
                  </div>
                  <button onClick={() => setInCheckout(true)}
                    className="w-full py-4 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl flex items-center justify-center gap-2 text-lg shadow-lg transition-all hover:-translate-y-0.5">
                    <FiCreditCard /> Comprar Ahora con Stripe
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* ── Stripe checkout step ── */
          <div className="max-w-2xl mx-auto space-y-6">
            <button onClick={() => setInCheckout(false)}
              className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1">
              ← Regresar al pedido
            </button>
            <div className="bg-blue-700 rounded-3xl p-6 text-white space-y-2">
              {activeItems.map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.name} × {fmtU(i.qty)} {i.unit}</span>
                  <span className="font-bold">${fmtMXN(i.qty * i.price)}</span>
                </div>
              ))}
              <div className="border-t border-blue-500 pt-2 flex justify-between font-black text-xl">
                <span>Total + IVA</span><span>${fmtMXN(totalIVA)} MXN</span>
              </div>
            </div>
            <Elements stripe={stripePromise} options={stripeOptions}>
              <PromoCheckoutForm total={totalIVA} />
            </Elements>
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1 font-medium">
              <FiShield /> Pagos procesados con seguridad PCI-DSS por Stripe
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
