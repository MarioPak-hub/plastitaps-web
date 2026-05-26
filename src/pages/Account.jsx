import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiLogOut, FiUserCheck, FiPackage, FiShield, FiMapPin, FiPhone,
  FiEdit3, FiSave, FiX, FiBriefcase, FiFileText, FiClock,
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useQuotes } from '../context/QuotesContext';

const ESTADO_LABEL = {
  nueva:      { label: 'Nueva',      color: 'bg-blue-100 text-blue-700' },
  revisada:   { label: 'Revisada',   color: 'bg-yellow-100 text-yellow-700' },
  contactado: { label: 'Contactado', color: 'bg-purple-100 text-purple-700' },
  aprobada:   { label: 'Aprobada',   color: 'bg-green-100 text-green-700' },
  rechazada:  { label: 'Rechazada',  color: 'bg-red-100 text-red-700' },
};

const TIPO_LABEL = {
  cotizacion:  'Cotización Industrial',
  personalizado: 'Diseño Personalizado',
  pedido:      'Pedido',
};

export default function Account() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { quotes } = useQuotes();

  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({});

  const handleLogout = () => { logout(); navigate('/'); };

  const startEditing = () => {
    setEditFields({
      direccion: user.direccion || '',
      telefono:  user.telefono  || '',
      empresa:   user.empresa   || '',
      rfc:       user.rfc       || '',
    });
    setEditing(true);
  };

  const saveEdits = () => {
    updateProfile({
      direccion: editFields.direccion.trim(),
      telefono:  editFields.telefono.trim(),
      empresa:   editFields.empresa.trim(),
      rfc:       (editFields.rfc || '').toUpperCase().trim(),
    });
    setEditing(false);
  };

  if (!user) return null;

  // Filter quotes for this user's email
  const myQuotes = quotes.filter(q => q.cliente?.email === user.email);

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-4 sm:px-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full font-bold text-xs tracking-wide mb-4">
              <FiShield className="text-lg" /> SESIÓN SEGURA ACTIVA
            </div>
            <h1 className="text-4xl font-black font-outfit text-slate-900">Mi Panel Corporativo</h1>
            <p className="text-slate-500 mt-2">Gestión centralizada de cuenta y expedientes de cotización.</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-colors w-full md:w-auto">
            <FiLogOut /> Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Left: identity + data */}
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
                <div className="flex justify-between items-center"><span className="text-slate-400">Empresa:</span><span className="font-bold text-slate-800 truncate ml-2">{user.empresa || '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">RFC:</span><span className="font-bold text-slate-800">{user.rfc || '—'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Nivel:</span><span className="font-bold text-green-600">B2B Prime</span></div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <FiMapPin className="text-blue-600" /> Datos Corporativos
                </h3>
                {!editing && (
                  <button onClick={startEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors">
                    <FiEdit3 className="text-xs" /> Editar
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  {[
                    { key: 'empresa', label: 'Razón Social', type: 'input', placeholder: 'Empresa S.A. de C.V.' },
                    { key: 'rfc',     label: 'RFC',          type: 'input', placeholder: 'ABC123456T12', maxLen: 13, upper: true },
                    { key: 'telefono',label: 'Teléfono',     type: 'input', placeholder: '33...' },
                    { key: 'direccion',label: 'Dirección',   type: 'textarea', placeholder: 'Parque Industrial...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea rows={2} value={editFields[f.key]}
                          onChange={e => setEditFields(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium resize-none transition-colors"
                          placeholder={f.placeholder} />
                      ) : (
                        <input type="text" value={editFields[f.key]} maxLength={f.maxLen}
                          onChange={e => setEditFields(p => ({ ...p, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium transition-colors uppercase-if"
                          style={f.upper ? { textTransform: 'uppercase' } : {}}
                          placeholder={f.placeholder} />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdits}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm">
                      <FiSave className="text-sm" /> Guardar
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors">
                      <FiX className="text-sm" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {[
                    { icon: FiBriefcase, label: 'Empresa', value: user.empresa },
                    { icon: FiShield,    label: 'RFC',     value: user.rfc },
                    { icon: FiPhone,     label: 'Teléfono',value: user.telefono },
                    { icon: FiMapPin,    label: 'Dirección',value: user.direccion },
                  ].map(({ icon: Icon, label, value }, idx, arr) => (
                    <div key={label} className={`flex items-start gap-3 ${idx < arr.length - 1 ? 'pb-3 border-b border-slate-100' : ''}`}>
                      <Icon className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">{label}</span>
                        <p className="font-medium text-slate-700 break-words leading-relaxed">{value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: expediente */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
            <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-3">
              <FiPackage className="text-blue-600" /> Expediente de Solicitudes
              {myQuotes.length > 0 && (
                <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  {myQuotes.length} registro{myQuotes.length !== 1 ? 's' : ''}
                </span>
              )}
            </h3>

            {myQuotes.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FiPackage className="text-5xl mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 text-sm mb-4">No hay cotizaciones vinculadas a su expediente.</p>
                <Link to="/catalogo" className="inline-block px-6 py-2 bg-white border border-slate-200 text-blue-600 rounded-full font-bold shadow-sm hover:shadow-md transition-shadow">
                  Iniciar Nueva Cotización
                </Link>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
                {myQuotes.map(q => {
                  const estado = ESTADO_LABEL[q.estado] || ESTADO_LABEL.nueva;
                  return (
                    <div key={q.folio} className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-black text-slate-800 font-outfit text-sm">{q.folio}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{TIPO_LABEL[q.tipo] || q.tipo}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${estado.color}`}>
                          {estado.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="text-slate-400" />
                          <span>{new Date(q.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {q.productos?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <FiPackage className="text-slate-400" />
                            <span>{q.productos.length} producto{q.productos.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {(q.subtotal || q.totalIVA) && (
                          <div className="font-bold text-blue-700">
                            ${(q.totalIVA || q.subtotal * 1.16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </div>
                        )}
                      </div>

                      {q.observaciones && (
                        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2 mt-2 flex items-start gap-1.5">
                          <FiFileText className="shrink-0 mt-0.5" /> {q.observaciones}
                        </p>
                      )}

                      {q.logoUrl && (
                        <a href={q.logoUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline mt-2">
                          Ver logo adjunto →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
