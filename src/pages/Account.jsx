import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUserCheck, FiPackage, FiShield } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ProtectedRoute already guards this – if we ever land here without user it means
  // loading is still true. Just render nothing to avoid a flash.
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-xs tracking-wide mb-4">
              <FiShield className="text-lg" /> SESIÓN SEGURA ACTIVA
            </div>
            <h1 className="text-4xl font-black font-outfit text-slate-900">Mi Panel Corporativo</h1>
            <p className="text-slate-500 mt-2">Gestión centralizada de cuenta y expedientes de cotización.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-colors w-full md:w-auto"
          >
            <FiLogOut /> Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              {user.picture
                ? <img src={user.picture} alt="Foto" className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200" />
                : <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><FiUserCheck className="text-2xl" /></div>
              }
              <div>
                <h3 className="font-bold text-slate-800">{user.name || 'Cliente B2B'}</h3>
                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center"><span className="text-slate-400">Empresa:</span> <span className="font-bold text-slate-800 truncate ml-2">{user.empresa || '—'}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-400">RFC:</span> <span className="font-bold text-slate-800">{user.rfc || '—'}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-400">Nivel:</span> <span className="font-bold text-green-600">B2B Prime</span></div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
            <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-3">
              <FiPackage className="text-blue-600" /> Expediente de Solicitudes
            </h3>
            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FiPackage className="text-5xl mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-sm mb-4">No hay cotizaciones recientes vinculadas a su expediente.</p>
              <Link to="/catalogo" className="inline-block px-6 py-2 bg-white border border-slate-200 text-blue-600 rounded-full font-bold shadow-sm hover:shadow-md transition-shadow">
                Iniciar Nueva Cotización
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
