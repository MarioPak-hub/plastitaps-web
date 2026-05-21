import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUserCheck, FiPackage, FiShield, FiMapPin, FiPhone, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  // Editable address state
  const [editing, setEditing] = useState(false);
  const [editDireccion, setEditDireccion] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startEditing = () => {
    setEditDireccion(user.direccion || '');
    setEditTelefono(user.telefono || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveAddress = () => {
    updateProfile({
      direccion: editDireccion.trim(),
      telefono: editTelefono.trim(),
    });
    setEditing(false);
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
          {/* Left column: User identity + Corporate data */}
          <div className="md:col-span-1 space-y-6">
            {/* Identity card */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                {user.picture
                  ? <img src={user.picture} alt="Foto" className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200" />
                  : <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><FiUserCheck className="text-2xl" /></div>
                }
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 truncate">{user.name || 'Cliente B2B'}</h3>
                  <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center"><span className="text-slate-400">Empresa:</span> <span className="font-bold text-slate-800 truncate ml-2">{user.empresa || '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">RFC:</span> <span className="font-bold text-slate-800">{user.rfc || '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Nivel:</span> <span className="font-bold text-green-600">B2B Prime</span></div>
              </div>
            </div>

            {/* Address & Phone section */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <FiMapPin className="text-blue-600" /> Dirección y Contacto
                </h3>
                {!editing && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors"
                  >
                    <FiEdit3 className="text-xs" /> Editar
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Dirección</label>
                    <textarea
                      value={editDireccion}
                      onChange={e => setEditDireccion(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium resize-none transition-colors"
                      placeholder="Parque Industrial... C.P..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Teléfono</label>
                    <input
                      type="tel"
                      value={editTelefono}
                      onChange={e => setEditTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium transition-colors"
                      placeholder="33..."
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveAddress}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                    >
                      <FiSave className="text-sm" /> Guardar
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors"
                    >
                      <FiX className="text-sm" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Dirección</span>
                      <p className="font-medium text-slate-700 break-words leading-relaxed">{user.direccion || '—'}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
                    <FiPhone className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Teléfono</span>
                      <p className="font-medium text-slate-700 truncate">{user.telefono || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
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
