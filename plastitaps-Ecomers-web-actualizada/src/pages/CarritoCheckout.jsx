import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiShield, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const fmtMXN = (n) => (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const fmtU   = (n) => (n || 0).toLocaleString('es-MX');

// ── Stripe form ──────────────────────────────────────────────────────────────
function StripeForm({ total }) {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clearPromoCart } = useCart();
  const [status, setStatus] = useState('idle');
  const [err,    setErr]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setStatus('loading');
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/pago-exitoso` },
    });
    if (error) { setStatus('error'); setErr(error.message); }
    // On success Stripe redirects, so we don't need clearPromoCart here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          <FiAlertCircle /> {err}
        </div>
      )}
      <button type="submit" disabled={!stripe || status === 'loading'}
        className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl transition-all ${status === 'loading' ? 'bg-blue-400 text-white cursor-wait' : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1'}`}
        style={{ boxShadow: status === 'idle' ? '0 8px 40px rgba(37,99,235,0.4)' : undefined }}>
        <FiCreditCard />
        {status === 'loading' ? 'Procesando pago seguro...' : `Pagar $${fmtMXN(total)} MXN`}
      </button>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CarritoCheckout() {
  const { promoItems, promoTotal, removeFromCart } = useCart();
  const total = promoTotal * 1.16;

  const stripeOpts = {
    mode:       'payment',
    amount:     Math.max(50, Math.round(total * 100)),
    currency:   'mxn',
    appearance: {
      theme:     'stripe',
      variables: { colorPrimary: '#2563eb', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' },
    },
  };

  if (promoItems.length === 0) {
    return (
      <div className="min-h-screen bg-white font-inter flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-slate-500 pt-32">
          <FiCheckCircle className="text-6xl text-green-500" />
          <p className="text-xl font-bold text-slate-800">Sin productos promocionales en el carrito.</p>
          <Link to="/disena-tu-vaso" className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">← Ver Promocionales</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5">
            <FiShield /> Checkout Seguro · Stripe
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900">
            Finaliza tu <span className="text-blue-600">Pedido</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">

          {/* Order summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden h-fit shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 font-outfit flex items-center gap-2">
              <FiCreditCard className="text-blue-600" /> Vasos Promocionales
            </div>
            <div className="divide-y divide-slate-100">
              {promoItems.map(item => (
                <div key={item.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{fmtU(item.quantity)} {item.unit || 'pz'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-black text-blue-700">${fmtMXN(item.quantity * item.price)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-5 bg-blue-700 space-y-1.5">
              <div className="flex justify-between text-blue-200 text-sm"><span>Subtotal</span><span>${fmtMXN(promoTotal)}</span></div>
              <div className="flex justify-between text-blue-200 text-sm"><span>IVA 16%</span><span>${fmtMXN(promoTotal * 0.16)}</span></div>
              <div className="flex justify-between text-white font-black text-2xl font-outfit pt-2 border-t border-blue-600">
                <span>Total</span><span>${fmtMXN(total)} MXN</span>
              </div>
            </div>
          </motion.div>

          {/* Stripe form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 space-y-5">
            <Elements stripe={stripePromise} options={stripeOpts}>
              <StripeForm total={total} />
            </Elements>
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <FiShield /> Pagos procesados con seguridad PCI-DSS por Stripe
            </p>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
