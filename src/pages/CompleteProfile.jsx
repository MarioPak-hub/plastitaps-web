import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate } from 'react-router-dom';
import { FiCheckCircle, FiShield, FiBriefcase } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Security } from '../utils/security';

const profileSchema = z.object({
  empresa:  z.string().min(2, 'El nombre o empresa es requerida'),
  direccion: z.string().min(5, 'Dirección requerida'),
  telefono: z.string().min(7, { message: 'El teléfono debe tener al menos 7 dígitos' }).regex(/^[\d\s\+\-\(\)]+$/, { message: 'Formato inválido. Ej: +52 33 1234 5678' })
});

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, completeProfile } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema)
  });

  if (!user) return <Navigate to="/login" replace />;
  if (user.profileComplete) return <Navigate to="/perfil" replace />;

  const onSubmit = (data) => {
    const cleanData = Security.sanitizeValues(data);
    completeProfile(cleanData);
    navigate('/perfil');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-xl mx-auto flex flex-col">
        <h1 className="text-4xl font-black font-outfit mb-3 text-center text-slate-900 tracking-tight">Verificación B2B</h1>
        <p className="text-slate-500 mb-8 text-center text-sm font-medium">Por políticas de seguridad financiera, necesitamos validar tus credenciales comerciales antes de autorizar transacciones, visualizaciones críticas o cotizaciones.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(37,99,235,0.04)] border border-slate-200">
          <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-5 rounded-[1.5rem] border border-blue-100">
             <img src={user.picture} alt="Profile" className="w-14 h-14 rounded-full shadow-sm bg-white" />
             <div>
                <p className="text-slate-800 font-bold block">{user.name}</p>
                <p className="text-slate-500 text-sm font-medium">{user.email}</p>
             </div>
             <div className="ml-auto text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                 <FiCheckCircle /> Verificado
             </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Nombre o Empresa *</label>
            <div className="relative">
              <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('empresa')} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" placeholder="Tu nombre o empresa" />
            </div>
            {errors.empresa && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-semibold"><FiShield /> {errors.empresa.message}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Dirección Industrial *</label>
            <textarea {...register('direccion')} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium whitespace-pre-line" placeholder="Parque Industrial... C.P..." />
            {errors.direccion && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-semibold"><FiShield /> {errors.direccion.message}</p>}
          </div>

          <div className="mb-8">
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Teléfono Corporativo *</label>
            <input type="tel" {...register('telefono')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 font-medium" placeholder="33..." />
            {errors.telefono && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-semibold"><FiShield /> {errors.telefono.message}</p>}
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-lg">
             <FiCheckCircle className="text-2xl" /> Enviar Autorización Corporativa
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
