import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headset, ShieldCheck, HandCoins, Star, Globe, Navigation } from 'lucide-react';
import { FiMapPin, FiPhone, FiMail, FiPhoneCall, FiMessageCircle } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Contact() {
  const [formStatus, setFormStatus] = useState(null);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormStatus("Gracias, procesaremos su solicitud a la brevedad");
    setTimeout(() => setFormStatus(null), 5000);
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800 flex flex-col">
      <Navbar />

      <div className="pt-32 pb-6 px-6 max-w-7xl mx-auto w-full">
        {/* Título de la Sección */}
        <h1 className="text-4xl md:text-5xl font-black font-outfit text-[#0a192f] mb-12 text-center">
          Centro de Atención <span className="text-blue-600">Plastitaps</span>
        </h1>

        {/* Bloque Superior (Fila de Información) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Col 1 */}
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <Headset className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Horarios de Atención y Servicios</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Nuestro equipo de atención al cliente está disponible en los horarios: Lunes a Viernes 09:00 am – 6:00 pm.
            </p>
          </div>
          {/* Col 2 */}
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Satisfacción Garantizada</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Productos fabricados con altos estándares y materiales de calidad.
            </p>
          </div>
          {/* Col 3 */}
          <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <HandCoins className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Transacción Segura</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Transparencia en la operación comercial.
            </p>
          </div>
        </div>

        {/* Bloque Medio: Contacto Directo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-stretch">
          
          {/* Tarjeta 1: Datos Oficiales */}
          <div className="bg-[#0a192f] text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

            {/* Encabezado centrado */}
            <div className="text-center mb-8 relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Empresa</p>
              <h3 className="font-outfit font-black text-4xl text-cyan-400 leading-tight">Plastitaps</h3>
            </div>

            <div className="space-y-5 text-sm text-slate-300 flex-1 relative z-10">

              {/* Dirección — coordenadas exactas Bodega 34 */}
              <div className="flex gap-3 items-start">
                <FiMapPin className="text-cyan-500 shrink-0 mt-1 text-lg" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=20.708815,-103.473531"
                  target="_blank" rel="noreferrer"
                  className="text-slate-300 hover:text-cyan-300 transition-colors leading-relaxed"
                  style={{ textDecoration: 'none' }}
                >
                  Carretera a Nogales 4935-Bodega 34,<br/>San Juan de Ocotán, 45019<br/>Zapopan, Jal.
                </a>
              </div>

              {/* Teléfono */}
              <div className="flex gap-3 items-center">
                <FiPhone className="text-cyan-500 shrink-0 text-lg" />
                <a
                  href="tel:3325965925"
                  className="text-slate-300 hover:text-cyan-300 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  3325965925
                </a>
              </div>

              {/* Correos */}
              <div className="flex gap-3 items-start">
                <FiMail className="text-cyan-500 shrink-0 mt-0.5 text-lg" />
                <div className="flex flex-col gap-1">
                  <a href="mailto:contacto@plastitaps.com" className="text-slate-300 hover:text-cyan-300 transition-colors" style={{ textDecoration: 'none' }}>
                    contacto@plastitaps.com
                  </a>
                  <a href="mailto:ventas@plastitaps.com" className="text-slate-300 hover:text-cyan-300 transition-colors" style={{ textDecoration: 'none' }}>
                    ventas@plastitaps.com
                  </a>
                </div>
              </div>

            </div>

            {/* Botones — sin cambios */}
            <div className="mt-8 relative z-10 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-3">
              <a href="tel:3325965925" className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-[#0a192f] font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25">
                <FiPhoneCall className="text-lg" /> Llámanos
              </a>
              <a href="https://wa.me/523325965925?text=Hola%20Plastitaps,%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n." target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#128C7E]/25">
                <FiMessageCircle className="text-lg" /> WhatsApp
              </a>
            </div>
          </div>


          {/* Tarjeta 2: Formulario de Contacto */}
          <div className="bg-[#fdfbf7] rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col h-full">
            <h3 className="font-outfit font-black text-2xl mb-6 text-[#0a192f]">Escríbenos</h3>
            <form onSubmit={handleContactSubmit} className="flex flex-col flex-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre Completo</label>
                <input type="text" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#eba014] focus:ring-1 focus:ring-[#eba014] transition-all shadow-sm" placeholder="Juan Pérez" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                  <input type="email" required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#eba014] focus:ring-1 focus:ring-[#eba014] transition-all shadow-sm" placeholder="juan@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Asunto</label>
                  <select required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#eba014] focus:ring-1 focus:ring-[#eba014] transition-all shadow-sm text-slate-700 outline-none">
                    <option value="">Seleccione una opción</option>
                    <option value="Cotizacion">Cotización</option>
                    <option value="EstadoPedido">Estado de Pedido</option>
                    <option value="QuejasSugerencias">Quejas / Sugerencias</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mensaje</label>
                <textarea required className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#eba014] focus:ring-1 focus:ring-[#eba014] transition-all shadow-sm resize-none flex-1" placeholder="¿En qué podemos ayudarte?" rows="3"></textarea>
              </div>
              
              <div className="mt-3 h-12">
                <AnimatePresence mode="wait">
                  {formStatus ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center text-green-700 font-bold text-sm text-center bg-green-100 rounded-xl ring-1 ring-green-200">
                      {formStatus}
                    </motion.div>
                  ) : (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} type="submit" className="w-full h-full bg-[#eba014] hover:bg-[#d6900f] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[#eba014]/40 flex items-center justify-center gap-2">
                      <FiMail className="text-lg" /> Enviar Solicitud
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bloque Inferior (Mapa Completo) */}
      <div className="w-full relative h-[500px] md:h-[650px] bg-slate-200 border-t border-slate-200">
        
        {/* Iframe: búsqueda por nombre para mostrar tarjeta nativa de Google Maps */}
        <iframe 
          src="https://maps.google.com/maps?q=Plastitaps+Carretera+a+Nogales+4935+Zapopan+Jalisco&t=&z=16&ie=UTF8&iwloc=&output=embed"
          className="w-full h-full"
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Ubicación Plastitaps"
        ></iframe>

        </div>

      <Footer />
    </div>
  );
}
