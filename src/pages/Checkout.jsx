import React, { useState } from 'react';
import { FiDownload, FiSend, FiFileText, FiShield, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useQuotes } from '../context/QuotesContext';
import { generateQuotationPDF } from '../utils/quotationPDF';

const TERMS = [
  '1. No incluye envío fuera de la ZMG.',
  '2. 50% de anticipo requerido para iniciar producción.',
  '3. No se manejan inventarios. Todo es sobre pedido.',
  '4. Cantidades y especificaciones se definen con un asesor de Plastitaps.',
];

// Folio local solo para el PDF — el folio oficial viene del servidor
const localFolio = () => `PLT-${Date.now().toString(36).toUpperCase()}`;

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user }        = useAuth();
  const { submitOrder } = useQuotes();
  const navigate        = useNavigate();

  const [pdfFolio]   = useState(localFolio);
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | done | error
  const [sendError,  setSendError]  = useState('');
  const [resultFolio, setResultFolio] = useState('');

  const handleDownloadPDF = () => {
    const doc = generateQuotationPDF({ cart, user, folio: pdfFolio });
    doc.save(`Cotizacion_Plastitaps_${pdfFolio}.pdf`);
  };

  const handleSend = async () => {
    setSendStatus('sending');
    setSendError('');
    try {
      const payload = {
        cliente: {
          nombre:   user?.name      || '',
          email:    user?.email     || '',
          telefono: user?.telefono  || '',
          empresa:  user?.empresa   || '',
          rfc:      user?.rfc       || '',
        },
        productos: cart.map(item => ({
          id:       item.id,
          name:     item.name,
          category: item.category,
        })),
      };

      const data = await submitOrder(payload, user?.email);

      setResultFolio(data.folio);
      clearCart();
      setSendStatus('done');
      setTimeout(() => navigate('/perfil'), 4000);
    } catch (err) {
      setSendError(err.message || 'Error de conexión. Intenta de nuevo.');
      setSendStatus('error');
    }
  };

  if (cart.length === 0 && sendStatus !== 'done') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 font-inter">
        <Navbar />
        <FiFileText className="text-6xl text-slate-300 mt-24" />
        <p className="text-slate-500 text-lg">No hay productos en tu cotización.</p>
        <button onClick={() => navigate('/catalogo')} className="text-blue-600 font-bold hover:underline">← Volver al catálogo</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-blue-700 bg-blue-100 px-5 py-2 rounded-full font-bold uppercase tracking-wider text-xs border border-blue-200 mb-5">
            <FiFileText /> Solicitud de Cotización
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900">
            Resumen de Cotización
          </h1>
        </div>

        {/* Success banner */}
        {sendStatus === 'done' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-2xl px-6 py-4 font-bold">
            <FiCheckCircle className="text-2xl text-green-600 shrink-0" />
            <div>
              <p>¡Cotización enviada exitosamente a ventas@plastitaps.com!</p>
              <p className="text-sm font-normal mt-0.5">Folio oficial: <strong>{resultFolio}</strong> — Redirigiendo a tu perfil…</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* Product table */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 font-outfit text-lg">Productos de Interés</h3>
              <span className="text-xs text-slate-400 font-medium">{cart.length} producto(s)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.map(item => (
                <div key={item.id} className="px-6 sm:px-8 py-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <FiCheckCircle className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.name}</p>
                    {item.category && <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 sm:px-8 py-5 bg-blue-700 flex justify-between items-center">
              <p className="text-white font-medium text-sm">
                Un asesor de Plastitaps te contactará para definir cantidades, personalización y cotización.
              </p>
              <FiShield className="text-blue-300 text-4xl shrink-0 ml-3" />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 space-y-5">

            {/* Client card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <FiShield className="text-blue-600" /> Datos del Solicitante
              </h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span className="text-slate-400">Empresa</span><span className="font-bold truncate ml-2">{user?.empresa || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">RFC</span><span className="font-bold">{user?.rfc || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-bold truncate ml-2">{user?.email}</span></div>
              </div>
            </div>

            {/* T&C */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <FiAlertCircle /> Términos y Condiciones
              </h4>
              <ul className="space-y-2">
                {TERMS.map((t, i) => <li key={i} className="text-xs text-amber-900 font-medium">{t}</li>)}
              </ul>
            </div>

            {/* Error */}
            {sendStatus === 'error' && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
                <FiAlertCircle className="shrink-0 mt-0.5 text-lg" /> {sendError}
              </div>
            )}

            {/* CTAs */}
            <button onClick={handleDownloadPDF}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <FiDownload /> Descargar PDF
            </button>

            <button onClick={handleSend} disabled={sendStatus === 'sending' || sendStatus === 'done'}
              className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                sendStatus === 'done'    ? 'bg-green-600 text-white cursor-default' :
                sendStatus === 'sending' ? 'bg-blue-400 text-white cursor-wait' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
              {sendStatus === 'sending' ? <><FiLoader className="animate-spin" /> Enviando...</> :
               sendStatus === 'done'    ? <><FiCheckCircle /> ¡Enviada!</> :
               <><FiSend /> Enviar a ventas@plastitaps.com</>}
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
