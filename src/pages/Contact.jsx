import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Headset, ShieldCheck, HandCoins } from 'lucide-react';
import { FiMapPin, FiPhone, FiMail, FiPhoneCall, FiMessageCircle, FiSend, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Security } from '../utils/security';
import { apiFetch } from '../utils/apiFetch';

const contactSchema = z.object({
  nombre:  z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email:   z.string().email('Correo electrónico no válido'),
  asunto:  z.string().min(1, 'Selecciona un asunto'),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

export default function Contact() {
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    setStatus('sending');
    setErrorMsg('');
    try {
      const clean = Security.sanitizeValues(data);
      const res   = await apiFetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(clean),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        reset();
        setTimeout(() => setStatus('idle'), 6000);
      } else {
        setErrorMsg(json.error || 'Error al enviar el mensaje.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800 flex flex-col">
      <Navbar />

      <div className="pt-24 sm:pt-32 pb-4 sm:pb-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-[#0a192f] mb-8 sm:mb-12 text-center">
          Centro de Atención <span className="text-blue-600">Plastitaps</span>
        </h1>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16">
          <div className="flex flex-col items-center text-center p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <Headset className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Horarios de Atención</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Lunes a Viernes 09:00 am – 6:00 pm.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Satisfacción Garantizada</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Productos fabricados con altos estándares y materiales de calidad.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-5 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
            <div className="w-16 h-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-6">
              <HandCoins className="w-8 h-8 text-blue-600 stroke-[1.5]" />
            </div>
            <h3 className="font-outfit font-bold text-xl text-[#0a192f] mb-3">Transacción Segura</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[250px]">
              Transparencia en la operación comercial.
            </p>
          </div>
        </div>

        {/* Contact blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-16 items-stretch">

          {/* Corporate data card */}
          <div className="bg-[#0a192f] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-800 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
            <div className="text-center mb-8 relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Empresa</p>
              <h3 className="font-outfit font-black text-4xl text-cyan-400 leading-tight">Plastitaps</h3>
            </div>
            <div className="space-y-5 text-sm text-slate-300 flex-1 relative z-10">
              <div className="flex gap-3 items-start">
                <FiMapPin className="text-cyan-500 shrink-0 mt-1 text-lg" />
                <a href="https://www.google.com/maps/search/?api=1&query=20.708815,-103.473531" target="_blank" rel="noreferrer"
                  className="text-slate-300 hover:text-cyan-300 transition-colors leading-relaxed" style={{ textDecoration: 'none' }}>
                  Carretera a Nogales 4935-Bodega 34,<br />San Juan de Ocotán, 45019<br />Zapopan, Jal.
                </a>
              </div>
              <div className="flex gap-3 items-center">
                <FiPhone className="text-cyan-500 shrink-0 text-lg" />
                <a href="tel:3325965925" className="text-slate-300 hover:text-cyan-300 transition-colors" style={{ textDecoration: 'none' }}>3325965925</a>
              </div>
              <div className="flex gap-3 items-start">
                <FiMail className="text-cyan-500 shrink-0 mt-0.5 text-lg" />
                <div className="flex flex-col gap-1">
                  <a href="mailto:contacto@plastitaps.com" className="text-slate-300 hover:text-cyan-300 transition-colors" style={{ textDecoration: 'none' }}>contacto@plastitaps.com</a>
                  <a href="mailto:ventas@plastitaps.com"   className="text-slate-300 hover:text-cyan-300 transition-colors" style={{ textDecoration: 'none' }}>ventas@plastitaps.com</a>
                </div>
              </div>
            </div>
            <div className="mt-8 relative z-10 pt-6 border-t border-slate-700/50 grid grid-cols-2 gap-3">
              <a href="tel:3325965925" className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-500 text-[#0a192f] font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25">
                <FiPhoneCall className="text-lg" /> Llámanos
              </a>
              <a href="https://wa.me/523325965925?text=Hola%20Plastitaps,%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n." target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-[#128C7E]/25">
                <FiMessageCircle className="text-lg" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-[#fdfbf7] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200 flex flex-col h-full">
            <h3 className="font-outfit font-black text-2xl mb-6 text-[#0a192f]">Escríbenos</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 gap-4" noValidate>
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  {...register('nombre')}
                  className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all shadow-sm ${errors.nombre ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#eba014] focus:ring-[#eba014]/20'}`}
                  placeholder="Juan Pérez"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.nombre.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Correo Electrónico *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all shadow-sm ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#eba014] focus:ring-[#eba014]/20'}`}
                    placeholder="juan@empresa.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
                </div>

                {/* Asunto */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Asunto *</label>
                  <select
                    {...register('asunto')}
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all shadow-sm text-slate-700 ${errors.asunto ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#eba014] focus:ring-[#eba014]/20'}`}
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Cotización">Cotización</option>
                    <option value="Estado de Pedido">Estado de Pedido</option>
                    <option value="Quejas / Sugerencias">Quejas / Sugerencias</option>
                  </select>
                  {errors.asunto && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.asunto.message}</p>}
                </div>
              </div>

              {/* Mensaje */}
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mensaje *</label>
                <textarea
                  {...register('mensaje')}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all shadow-sm resize-none flex-1 ${errors.mensaje ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#eba014] focus:ring-[#eba014]/20'}`}
                  placeholder="¿En qué podemos ayudarte?"
                  rows="3"
                />
                {errors.mensaje && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.mensaje.message}</p>}
              </div>

              {/* CTA */}
              <div className="mt-3 h-12">
                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center gap-2 text-green-700 font-bold text-sm bg-green-100 rounded-xl ring-1 ring-green-200">
                      <FiCheckCircle /> Mensaje enviado correctamente
                    </motion.div>
                  ) : status === 'error' ? (
                    <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center gap-2 text-red-700 font-bold text-sm bg-red-50 rounded-xl ring-1 ring-red-200 px-3 text-center">
                      <FiAlertCircle className="shrink-0" /> {errorMsg}
                    </motion.div>
                  ) : (
                    <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      type="submit" disabled={status === 'sending'}
                      className={`w-full h-full font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${status === 'sending' ? 'bg-[#eba014]/70 text-white cursor-wait' : 'bg-[#eba014] hover:bg-[#d6900f] text-white hover:shadow-[#eba014]/40'}`}>
                      {status === 'sending' ? <><FiLoader className="animate-spin" /> Enviando...</> : <><FiSend /> Enviar Solicitud</>}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full relative h-[350px] sm:h-[450px] md:h-[500px] lg:h-[650px] bg-slate-200 border-t border-slate-200">
        <iframe
          src="https://maps.google.com/maps?q=Plastitaps+Carretera+a+Nogales+4935+Zapopan+Jalisco&t=&z=16&ie=UTF8&iwloc=&output=embed"
          className="w-full h-full" style={{ border: 0 }}
          allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Ubicación Plastitaps"
        />
      </div>

      <Footer />
    </div>
  );
}
