import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCreditCard, FiPlus, FiMinus, FiCheckCircle,
  FiUpload, FiRefreshCcw, FiSend,
  FiShoppingBag
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { TEMPLATES, INK_COLORS } from '../components/VasoViewer3D';
import promoCatalog from '../data/promo_catalog.json';
import { Security } from '../utils/security';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const VasoViewer3D = lazy(() => import('../components/VasoViewer3D'));
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const fmtMXN = (n) => (n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
const fmtU   = (n) => (n || 0).toLocaleString('es-MX');
const MIN_QTY = 10;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Nuestros Promocionales
// ─────────────────────────────────────────────────────────────────────────────
function PromoGallery() {
  const { addToCart } = useCart();
  const [qtys,  setQtys]  = useState(() => Object.fromEntries(promoCatalog.map(p => [p.id, p.moq])));
  const [added, setAdded] = useState({});

  const handleAdd = (p) => {
    addToCart({ ...p, moq: p.moq }, qtys[p.id] || p.moq);
    setAdded(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 2000);
  };

  const setQty = (id, qty, moq) => setQtys(prev => ({ ...prev, [id]: Math.max(moq, qty) }));

  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5">
          <FiCreditCard /> Compra Directa · Stripe
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit tracking-tight text-slate-900 mb-3">
          Nuestros <span className="text-blue-600">Promocionales</span>
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
          Vasos de temporada listos. Mínimo {fmtU(MIN_QTY)} piezas.<br />
          Añade al carrito y paga todo junto con tarjeta.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {promoCatalog.map(p => {
          const qty = qtys[p.id] || p.moq;
          const ok  = !!added[p.id];
          return (
            <motion.div key={p.id} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 hover:border-blue-300 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="relative h-40 sm:h-48 flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${p.accentColor}15, ${p.accentColor}05)` }}>
                <span className="absolute top-3 left-3 text-2xl sm:text-3xl">{p.emoji}</span>
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: p.badgeColor }}>{p.badge}</span>
                <img src="/vaso_transparente.png" alt={p.name} className="h-28 sm:h-36 object-contain relative z-10 drop-shadow-xl" style={{ filter: p.filter }} />
              </div>
              <div className="p-4 sm:p-5 bg-white flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-3 sm:mb-4 flex-1">{p.subtitle}</p>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div><p className="text-xs text-slate-500">Precio / pz</p><p className="font-black text-blue-700 text-lg sm:text-xl">${fmtMXN(p.price)}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-500">Mín {fmtU(p.moq)} pz</p><p className="text-xs font-bold text-slate-600">${fmtMXN(p.moq * p.price * 1.16)} c/IVA</p></div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setQty(p.id, qty - 10, p.moq)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center border border-slate-200 transition-colors">
                    <FiMinus className="text-sm" />
                  </button>
                  <input type="number" min={p.moq} step={10} value={qty}
                    onChange={e => setQty(p.id, parseInt(e.target.value) || p.moq, p.moq)}
                    className="flex-1 text-center font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors" />
                  <button onClick={() => setQty(p.id, qty + 10, p.moq)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 transition-colors hover:bg-blue-100">
                    <FiPlus className="text-sm" />
                  </button>
                </div>
                <button onClick={() => handleAdd(p)}
                  className={`w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${ok ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5 hover:shadow-lg'}`}>
                  {ok ? <><FiCheckCircle /> ¡Agregado al Carrito!</> : <><FiShoppingBag /> Añadir al Carrito</>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Crea tu Propio Vaso (3D Studio) — Diseño mejorado y limpio
// ─────────────────────────────────────────────────────────────────────────────
function Studio3D() {
  const { user }  = useAuth();
  const [cupColor,  setCupColor]  = useState(TEMPLATES[0].color);
  const [template,  setTemplate]  = useState(TEMPLATES[0]);
  const [qty,       setQty]       = useState(MIN_QTY);
  const [logo,      setLogo]      = useState(null);
  const [notes,     setNotes]     = useState('');
  const [mailStatus,setMailStatus]= useState('idle');

  const handleTemplate = (t) => { setTemplate(t); setCupColor(t.color); };
  const handleLogo     = (e)  => { const f = e.target.files[0]; if (f) setLogo(URL.createObjectURL(f)); };
  const colorName = INK_COLORS.find(c => c.hex === cupColor)?.name || cupColor;

  const handleSend = () => {
    setMailStatus('sending');
    const dest = Security.getVentasEndpoint();
    const body = [
      `SOLICITUD DISEÑO PERSONALIZADO`,
      ``,
      `Cliente: ${user?.empresa || user?.name || 'N/A'}`,
      `Email:   ${user?.email || 'N/A'}`,
      `Plantilla: ${template.label}`,
      `Color: ${colorName} (${cupColor})`,
      `Cantidad solicitada: ${fmtU(qty)} pz`,
      `Notas: ${notes || '—'}`,
      ``,
      `Por favor cotizar tiempos de entrega y validar arte.`,
    ].join('\n');
    window.location.href = `mailto:${dest}?subject=${encodeURIComponent(`Diseño Personalizado — ${template.label}`)}&body=${encodeURIComponent(body)}`;
    setTimeout(() => setMailStatus('done'), 1500);
  };

  return (
    <section style={{ background: 'radial-gradient(ellipse at 60% 20%, #1e293b 0%, #0f172a 55%, #020617 100%)' }}
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6">

      {/* Rim lights */}
      <div className="pointer-events-none absolute top-0 left-0 w-1/3 h-full" style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.1), transparent)' }} />
      <div className="pointer-events-none absolute top-0 right-0 w-1/3 h-full" style={{ background: 'linear-gradient(270deg, rgba(236,72,153,0.08), transparent)' }} />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 sm:mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Estudio 3D · Diseño Exclusivo
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit tracking-tight text-white mb-2 sm:mb-3">
            Crea tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Propio Vaso</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Elige un color, sube tu logo y nosotros lo cotizamos. Mínimo {fmtU(MIN_QTY)} pz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left: 3D Canvas */}
          <div>
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden relative"
              style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0.7) 70%)', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10" style={{ background: 'linear-gradient(90deg, rgba(129,140,248,0.25), transparent)' }} />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10" style={{ background: 'linear-gradient(270deg, rgba(232,121,249,0.2), transparent)' }} />

              <Suspense fallback={
                <div className="flex flex-col items-center justify-center gap-3" style={{ height: 380 }}>
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-xs font-bold">Cargando modelo 3D...</p>
                </div>
              }>
                <VasoViewer3D color={cupColor} logo={logo} />
              </Suspense>

              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs text-indigo-300 font-bold z-20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                Arrastra para rotar · WebGL
              </div>
            </div>

            {/* Plantillas */}
            <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 justify-center">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => handleTemplate(t)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs border-2 transition-all ${template.id === t.id ? 'bg-white text-slate-900 border-white scale-105 shadow-lg' : 'border-white/20 text-slate-300 hover:border-white/50 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4 sm:space-y-5">

            {/* Color palette */}
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-bold font-outfit flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]" /> Color del Vaso
              </h3>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {INK_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setCupColor(c.hex)}
                    className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all text-left ${cupColor === c.hex ? 'border-indigo-400 bg-white/10 shadow-[0_0_8px_rgba(129,140,248,0.4)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                    <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 bg-black/30 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10">
                <input type="color" value={cupColor} onChange={e => setCupColor(e.target.value)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
                <div>
                  <p className="text-indigo-300 font-mono text-xs font-bold">{cupColor.toUpperCase()}</p>
                  <p className="text-slate-500 text-[10px]">color personalizado</p>
                </div>
              </div>
            </div>

            {/* Logo upload */}
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-bold font-outfit flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" /> Logo (PNG/SVG)
              </h3>
              {!logo ? (
                <label className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400/70 rounded-xl sm:rounded-2xl transition-all hover:bg-indigo-500/5 group">
                  <FiUpload className="text-xl sm:text-2xl text-indigo-400/50 group-hover:text-indigo-400 mb-2 transition-colors" />
                  <span className="text-xs sm:text-sm text-slate-300 font-bold">Sube tu archivo (PNG/SVG)</span>
                  <span className="text-[10px] text-slate-500 mt-1">Nombre del archivo (opcional)</span>
                  <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogo} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl sm:rounded-2xl p-3">
                  <img src={logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl bg-white/10 p-1" />
                  <div className="flex-1"><p className="text-green-400 text-xs font-bold">✓ Arte cargado</p><p className="text-slate-500 text-[10px]">Irá a revisión de impresión</p></div>
                  <button onClick={() => setLogo(null)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><FiRefreshCcw className="text-sm" /></button>
                </div>
              )}
            </div>

            {/* Quantity + Notes */}
            <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-bold font-outfit text-sm sm:text-base">Cantidad y Detalles</h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => setQty(q => Math.max(MIN_QTY, q - 10))}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10">
                  <FiMinus />
                </button>
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
                  <input type="number" min={MIN_QTY} step={10} value={qty}
                    onChange={e => setQty(Math.max(MIN_QTY, parseInt(e.target.value) || MIN_QTY))}
                    className="bg-transparent text-white font-black text-lg sm:text-xl w-20 sm:w-24 outline-none" />
                  <span className="text-slate-400 text-xs sm:text-sm">piezas</span>
                </div>
                <button onClick={() => setQty(q => q + 10)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-300 flex items-center justify-center transition-colors border border-indigo-500/20">
                  <FiPlus />
                </button>
              </div>
              <p className="text-slate-500 text-[10px] sm:text-xs">Mínimo {fmtU(MIN_QTY)} piezas · paso de 10</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Notas: colores de impresión, fecha límite, especificaciones..."
                className="w-full bg-black/30 border border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>

            {/* CTA */}
            <button onClick={handleSend} disabled={mailStatus === 'sending'}
              className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all ${
                mailStatus === 'done'    ? 'bg-green-600 text-white' :
                mailStatus === 'sending' ? 'bg-indigo-400 text-white cursor-wait' :
                'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white hover:-translate-y-1'
              }`}
              style={{ boxShadow: mailStatus === 'idle' ? '0 8px 32px rgba(99,102,241,0.4)' : undefined }}>
              {mailStatus === 'done'    ? <><FiCheckCircle /> ¡Solicitud enviada a Ventas!</> :
               mailStatus === 'sending' ? 'Preparando...' :
               <><FiSend /> Cotizar Diseño</>}
            </button>
            <p className="text-center text-slate-500 text-[10px] sm:text-xs">
              Genera un email directo a ventas@plastitaps.com para cotización y validación de arte.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — Diseño mejorado con espaciados simétricos
// ─────────────────────────────────────────────────────────────────────────────
export default function InteractiveDesign() {
  return (
    <div className="min-h-screen font-inter text-slate-800 bg-white">
      <Navbar />

      {/* Header de la página — espaciado reducido y limpio */}
      <div className="pt-24 sm:pt-28 pb-4 sm:pb-6 px-4 sm:px-6 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-outfit text-slate-900">
          Personaliza tu <span className="text-blue-600">Vaso</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">Compra directo o diseña el tuyo. Mínimo 10 piezas.</p>
      </div>

      {/* Floor 1: Photo gallery + Stripe */}
      <PromoGallery />

      {/* Divider — transición limpia */}
      <div className="relative h-12 sm:h-16 bg-white overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, white, #0f172a)' }} />
        <div className="relative z-10 flex items-center justify-center h-full gap-3 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap">O crea el tuyo desde cero</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
        </div>
      </div>

      {/* Floor 2: 3D Studio */}
      <Studio3D />

      <Footer />
    </div>
  );
}
