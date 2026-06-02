import React, { useState, useRef, Suspense, lazy, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiCreditCard, FiMinus, FiPlus,
  FiUpload, FiRefreshCcw, FiSend,
  FiAlertCircle, FiLoader, FiCheckCircle, FiBox
} from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { INK_COLORS } from '../components/VasoViewer3D';
import ProductModel3D from '../components/ProductModel3D';
import promoCatalog from '../data/promo_catalog.json';
import { useAuth } from '../context/AuthContext';
import { useQuotes } from '../context/QuotesContext';

const VasoViewer3D = lazy(() => import('../components/VasoViewer3D'));

const fmtU = (n) => (n || 0).toLocaleString('es-MX');
const MIN_QTY = 10;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Nuestros Promocionales — click en tarjeta abre modal
// ─────────────────────────────────────────────────────────────────────────────
function PromoGallery({ studioRef }) {
  const scrollToStudio = () => {
    studioRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="py-10 sm:py-14 lg:py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5">
          <FiCreditCard /> Elige tu modelo · Personaliza abajo
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit tracking-tight text-slate-900 mb-3">
          Nuestros <span className="text-blue-600">Promocionales</span>
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
          Elige el vaso que más te guste y personalízalo abajo con tu logo y color.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {promoCatalog.map(p => {
          return (
            <motion.div key={p.id} whileHover={{ y: -6, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}
              onClick={scrollToStudio}
              className="w-full max-w-sm rounded-2xl sm:rounded-3xl border-2 border-slate-200 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col cursor-pointer">
              <div className="relative h-48 sm:h-56 flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${p.accentColor}18, ${p.accentColor}06)` }}>
                <span className="absolute top-3 left-3 text-2xl sm:text-3xl z-10 pointer-events-none">{p.emoji}</span>
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-2.5 py-1 rounded-full text-white z-10 pointer-events-none" style={{ backgroundColor: p.badgeColor }}>{p.badge}</span>
                {p.modelo3D ? (
                  <div className="absolute inset-0">
                    <ProductModel3D
                      modelPath={p.modelo3D}
                      selectedColor={p.colores?.[0] || '#cccccc'}
                      height="100%"
                      disableControls
                    />
                  </div>
                ) : (
                  <img src={p.image} alt={p.name} className="h-32 sm:h-40 object-contain relative z-10 drop-shadow-xl" style={{ filter: p.filter }} />
                )}
              </div>
              <div className="p-4 sm:p-5 bg-white flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-1 text-center">{p.name}</h3>
                <p className="text-[11px] italic text-slate-400 mb-4 text-center line-clamp-2">
                  {p.shortDescription || p.subtitle}
                </p>
                <button onClick={scrollToStudio}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5">
                  <Sparkles className="w-4 h-4" /> Personalizar este vaso
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
// SECTION 2: Estudio 3D — envío real al backend con Firebase upload
// ─────────────────────────────────────────────────────────────────────────────
// Convierte un File a data URL base64 — usado para enviar el logo al backend
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Studio3D() {
  const { user } = useAuth();
  const { submitQuote } = useQuotes();

  const availableModels = useMemo(() => promoCatalog.filter(p => p.modelo3D), []);
  const [selectedPromo, setSelectedPromo] = useState(availableModels[0] || null);

  const [cupColor, setCupColor] = useState(INK_COLORS[0].hex);
  const [qty, setQty] = useState(MIN_QTY);
  const [logoFile, setLogoFile] = useState(null);   // File object
  const [logoPreview, setLogoPreview] = useState(null);   // blob URL for VasoViewer3D
  const [notes, setNotes] = useState('');
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | done | error
  const [sendError, setSendError] = useState('');
  const [resultFolio, setResultFolio] = useState('');

  const handleSelectPromo = (promo) => {
    setSelectedPromo(promo);
    removeLogo(); // clear logo when switching models
  };

  const colorName = INK_COLORS.find(c => c.hex === cupColor)?.name || cupColor;

  const handleLogo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const removeLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSend = async () => {
    setSendStatus('sending');
    setSendError('');

    try {
      // 1. Convertir logo (si existe) a base64 — el backend lo guardará en /uploads
      let logoBase64 = null;
      let logoExt = null;
      if (logoFile) {
        logoBase64 = await fileToDataUrl(logoFile);
        logoExt = (logoFile.name.split('.').pop() || 'png').toLowerCase();
      }

      // 2. Construir payload
      const payload = {
        tipo: 'personalizado',
        cliente: {
          nombre: user?.name || '',
          email: user?.email || '',
          telefono: user?.telefono || '',
          empresa: user?.empresa || '',
          rfc: user?.rfc || '',
        },
        productos: [{
          nombre: `Vaso Personalizado - ${selectedPromo?.name || 'Genérico'}`,
          cantidad: qty,
          color: `${colorName} (${cupColor})`,
          tipo: 'diseño-personalizado',
        }],
        logoBase64,
        logoExt,
        observaciones: notes || '',
      };

      // 3. Submit (POST + Firestore en QuotesContext)
      const data = await submitQuote(payload, user?.email);

      setResultFolio(data.folio);
      setSendStatus('done');
    } catch (err) {
      setSendError(err.message || 'Error de conexión. Intenta de nuevo.');
      setSendStatus('error');
    }
  };

  return (
    <section style={{ background: 'radial-gradient(ellipse at 60% 20%, #1e293b 0%, #0f172a 55%, #020617 100%)' }}
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6">

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

          {/* 3D Canvas */}
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
                {selectedPromo && (
                  <VasoViewer3D
                    color={cupColor}
                    logo={logoPreview}
                    modelPath={selectedPromo.modelo3D}
                  />
                )}
              </Suspense>
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs text-indigo-300 font-bold z-20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                Arrastra para rotar · WebGL
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 sm:space-y-5">

            {/* Model Selector */}
            {availableModels.length > 0 && (
              <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
                <h3 className="text-white font-bold font-outfit flex items-center gap-2 text-sm sm:text-base">
                  <FiBox className="text-indigo-400" /> Elige tu Vaso
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableModels.map(promo => (
                    <button key={promo.id} onClick={() => handleSelectPromo(promo)}
                      className={`flex flex-col items-center justify-center gap-1 p-1.5 sm:p-2 rounded-xl border transition-all ${selectedPromo?.id === promo.id ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_8px_rgba(129,140,248,0.4)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                      {/* Mini canvas 3D — pointer-events none para no bloquear el click del botón */}
                      <div className="w-full rounded-lg overflow-hidden pointer-events-none" style={{ height: 72 }}>
                        <Suspense fallback={
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        }>
                          <ProductModel3D
                            modelPath={promo.modelo3D}
                            selectedColor={promo.colores?.[0] || '#cccccc'}
                            height="72px"
                            disableControls
                          />
                        </Suspense>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight text-center">{promo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              {!logoPreview ? (
                <label className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400/70 rounded-xl sm:rounded-2xl transition-all hover:bg-indigo-500/5 group cursor-pointer">
                  <FiUpload className="text-xl sm:text-2xl text-indigo-400/50 group-hover:text-indigo-400 mb-2 transition-colors" />
                  <span className="text-xs sm:text-sm text-slate-300 font-bold">Sube tu archivo (PNG/SVG/JPG)</span>
                  <span className="text-[10px] text-slate-500 mt-1">Se adjunta a la solicitud al enviar</span>
                  <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogo} className="hidden" />
                </label>
              ) : (
                <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl sm:rounded-2xl p-3">
                  <img src={logoPreview} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl bg-white/10 p-1" />
                  <div className="flex-1">
                    <p className="text-green-400 text-xs font-bold">✓ Arte cargado</p>
                    <p className="text-slate-500 text-[10px]">{logoFile?.name}</p>
                  </div>
                  <button onClick={removeLogo} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <FiRefreshCcw className="text-sm" />
                  </button>
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

            {/* Error */}
            {sendStatus === 'error' && (
              <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/40 rounded-2xl p-4 text-red-300 text-sm font-medium">
                <FiAlertCircle className="shrink-0 mt-0.5" /> {sendError}
              </div>
            )}

            {/* Success */}
            {sendStatus === 'done' && (
              <div className="flex items-start gap-2 bg-green-900/30 border border-green-500/40 rounded-2xl p-4 text-green-300 text-sm font-bold">
                <FiCheckCircle className="shrink-0 mt-0.5 text-lg" />
                <div>
                  <p>¡Cotización registrada exitosamente!</p>
                  <p className="font-normal text-xs mt-0.5 text-green-400">Folio: {resultFolio} — Ventas se pondrá en contacto.</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <button onClick={handleSend} disabled={sendStatus === 'sending' || sendStatus === 'done'}
              className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all ${sendStatus === 'done' ? 'bg-green-600 text-white cursor-default' :
                  sendStatus === 'sending' ? 'bg-indigo-400 text-white cursor-wait' :
                    'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white hover:-translate-y-1'
                }`}
              style={{ boxShadow: sendStatus === 'idle' ? '0 8px 32px rgba(99,102,241,0.4)' : undefined }}>
              {sendStatus === 'sending' ? <><FiLoader className="animate-spin" /> Procesando...</> :
                sendStatus === 'done' ? <><FiCheckCircle /> ¡Solicitud Enviada!</> :
                  <><FiSend /> Cotizar Diseño</>}
            </button>
            <p className="text-center text-slate-500 text-[10px] sm:text-xs">
              Tu solicitud llega a ventas@plastitaps.com para cotización y validación de arte.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InteractiveDesign({ openProductBySlug }) {
  const studioRef = useRef(null);
  return (
    <div className="min-h-screen font-inter text-slate-800 bg-white">
      <Navbar />

      <div className="pt-20 sm:pt-24 pb-2 sm:pb-3 px-4 sm:px-6 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-outfit text-slate-900">
          Personaliza tu <span className="text-blue-600">Vaso</span>
        </h1>
        <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">Elige un modelo y diseña el tuyo. Mínimo 10 piezas.</p>
      </div>

      <PromoGallery studioRef={studioRef} />

      <div className="relative h-12 sm:h-16 bg-white overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, white, #0f172a)' }} />
        <div className="relative z-10 flex items-center justify-center h-full gap-3 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-400" />
          <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">Personaliza aquí tu vaso</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-400" />
        </div>
      </div>

      <div ref={studioRef}>
        <Studio3D />
      </div>

      <Footer />
    </div>
  );
}
