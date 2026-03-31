import React, { useState } from 'react';
import { FiDownload, FiSend, FiFileText, FiShield, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Security } from '../utils/security';
import { generateQuotationPDF } from '../utils/quotationPDF';

const fmtMXN = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
const fmtU = (n) => n.toLocaleString('es-MX');
const fmtP = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 4 });

const TERMS = [
  '1. Precios en MXN sujetos a cambio sin previo aviso.',
  '2. No incluye envío fuera de la ZMG.',
  '3. 50% de anticipo requerido para iniciar producción.',
  '4. No se manejan inventarios. Todo es sobre pedido.',
  '5. Penalización del 80% en cancelaciones no autorizadas.',
];

export default function Checkout() {
  const { cart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const folio = `PLT-${Date.now().toString(36).toUpperCase()}`;
  const totalIVA = totalPrice * 1.16;

  const handleDownloadPDF = () => {
    const doc = generateQuotationPDF({ cart, user, folio });
    doc.save(`Cotizacion_Plastitaps_${folio}.pdf`);
  };

  const handleSendEmail = () => {
    const dest = Security.getVentasEndpoint();
    let body = `Cotización Folio: ${folio}\n\n`;
    body += `Cliente: ${user?.empresa || 'N/A'} | RFC: ${user?.rfc || 'N/A'}\n`;
    body += `Email: ${user?.email} | Tel: ${user?.telefono || 'N/A'}\n\n`;
    body += `PRODUCTOS:\n`;
    cart.forEach((item, i) => {
      body += `${i + 1}. ${item.name} — ${fmtU(item.quantity)} ${item.unit} × $${fmtP(item.price)} = $${fmtMXN(item.quantity * item.price)}\n`;
    });
    body += `\nSUBTOTAL: $${fmtMXN(totalPrice)} | TOTAL + IVA: $${fmtMXN(totalIVA)} MXN\n\n`;
    body += TERMS.join('\n');

    window.location.href = `mailto:${dest}?subject=${encodeURIComponent(`Cotización ${folio} — ${user?.empresa || 'Cliente'}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    clearCart();
    setTimeout(() => navigate('/perfil'), 2500);
  };

  if (cart.length === 0 && !sent) {
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
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-blue-700 bg-blue-100 px-5 py-2 rounded-full font-bold uppercase tracking-wider text-xs border border-blue-200 mb-5">
            <FiFileText /> Cotización Industrial · Folio {folio}
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900">
            Resumen de Cotización
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* Product Table */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2 bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 font-outfit text-lg">Detalle de Productos</h3>
              <span className="text-xs text-slate-400 font-medium">{cart.length} línea(s)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.map(item => (
                <div key={item.id} className="px-8 py-5 flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.category} · MOQ: {fmtU(item.moq)} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">{fmtU(item.quantity)} {item.unit} × ${fmtP(item.price)}</p>
                    <p className="font-black text-blue-700 font-outfit">${fmtMXN(item.quantity * item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-8 py-5 bg-blue-700 flex justify-between items-center">
              <div>
                <p className="text-blue-200 text-sm">Subtotal sin IVA: <span className="font-bold text-white">${fmtMXN(totalPrice)}</span></p>
                <p className="text-white font-black text-xl font-outfit mt-1">Total + IVA 16%: ${fmtMXN(totalIVA)} MXN</p>
              </div>
              <FiShield className="text-blue-300 text-4xl" />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 space-y-5">

            {/* Client card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><FiShield className="text-blue-600" /> Datos del Solicitante</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span className="text-slate-400">Empresa</span><span className="font-bold truncate ml-2">{user?.empresa || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">RFC</span><span className="font-bold">{user?.rfc || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-bold truncate ml-2">{user?.email}</span></div>
              </div>
            </div>

            {/* T&C */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide"><FiAlertCircle /> Términos y Condiciones</h4>
              <ul className="space-y-2">
                {TERMS.map((t, i) => <li key={i} className="text-xs text-amber-900 font-medium">{t}</li>)}
              </ul>
            </div>

            {/* CTAs */}
            <button onClick={handleDownloadPDF}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <FiDownload /> Descargar PDF
            </button>
            <button onClick={handleSendEmail}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <FiSend /> Enviar a ventas@plastitaps.com
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
