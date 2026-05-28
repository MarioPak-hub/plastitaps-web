import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiLogOut, FiUserCheck, FiPackage, FiShield, FiMapPin, FiPhone,
  FiEdit3, FiSave, FiX, FiBriefcase, FiFileText, FiClock,
  FiAlertCircle, FiCheck, FiRefreshCw, FiXCircle, FiTrash2,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useQuotes } from '../context/QuotesContext';

const ESTADO_LABEL = {
  nueva:      { label: 'Nueva',      color: 'bg-blue-100   text-blue-700' },
  revisada:   { label: 'Revisada',   color: 'bg-yellow-100 text-yellow-700' },
  contactado: { label: 'Contactado', color: 'bg-orange-100 text-orange-700' },
  cotizada:   { label: 'Cotizada',   color: 'bg-purple-100 text-purple-700' },
  aprobada:   { label: 'Aprobada',   color: 'bg-green-100  text-green-700' },
  rechazada:  { label: 'Rechazada',  color: 'bg-red-100    text-red-700' },
  // Por completitud — las canceladas no se muestran (filtradas en myQuotes),
  // pero el label existe por si alguien debuggea o si Firestore las trae temporalmente.
  cancelada:  { label: 'Cancelada',  color: 'bg-slate-200  text-slate-600' },
};

const TIPO_LABEL = {
  cotizacion:    'Cotización Industrial',
  personalizado: 'Diseño Personalizado',
  pedido:        'Pedido',
};

const POLL_INTERVAL_MS = 10000; // 10 segundos — cambios de estado de Bind se reflejan rápido en el expediente

// ── Helper: arma el objeto cliente para mostrar ─────────────────────────────
function getCliente(q) {
  // Firestore: campos planos / API: anidados en `cliente`
  return q.cliente || {
    email:    q.clienteEmail,
    nombre:   q.clienteNombre,
    empresa:  q.clienteEmpresa,
    telefono: q.clienteTelefono,
    rfc:      q.clienteRfc,
  };
}

// ── Skeleton para el loading inicial ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="border border-slate-200 rounded-2xl p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-5 bg-slate-200 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { quotes, loading, error, loadFromFirestore, syncEstadoFromServer, cancelQuote } = useQuotes();

  const [editing,    setEditing]    = useState(false);
  const [editFields, setEditFields] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  // ── Estado de cancelación ──────────────────────────────────────────────────
  // confirmingCancel: el quote pendiente de confirmar (o null si modal cerrado)
  // cancellingFolio:  folio actualmente en proceso de cancelación (para spinner)
  // cancelErrors:     { [folio]: 'mensaje' } para mostrar inline si una falla
  const [confirmingCancel, setConfirmingCancel] = useState(null);
  const [cancellingFolio,  setCancellingFolio]  = useState(null);
  const [cancelErrors,     setCancelErrors]     = useState({});

  // ── Refs para evitar stale closure dentro del setInterval ──────────────────
  // El useEffect de polling solo corre cuando cambia user?.email, así que la
  // función `tick` captura `quotes` y `syncEstadoFromServer` del momento del
  // mount. Sin estos refs, el polling solo veía los folios que estaban en el
  // localStorage cache al cargar la página — cualquier solicitud nueva creada
  // en la misma sesión jamás se polleaba.
  const quotesRef               = useRef(quotes);
  const syncEstadoFromServerRef = useRef(syncEstadoFromServer);

  // Actualizar refs en cada render para que el tick siempre lea los valores
  // más recientes sin necesidad de reiniciar el setInterval.
  useEffect(() => {
    quotesRef.current               = quotes;
    syncEstadoFromServerRef.current = syncEstadoFromServer;
  });

  // ── Cargar historial al montar + polling cada 10s ──────────────────────────
  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;

    // Carga inicial
    loadFromFirestore(user.email);

    // Polling: revisa el backend en busca de cambios de estado y sincroniza Firestore
    const tick = async () => {
      if (cancelled) return;
      // Para cada solicitud local, preguntar al backend si cambió el estado.
      // Leemos `quotes` desde el ref para incluir solicitudes recién creadas.
      // Excluimos canceladas — no tiene sentido pollearlas.
      const localQuotes = quotesRef.current.filter(q =>
        q.clienteEmail === user.email && q.estado !== 'cancelada'
      );
      await Promise.all(localQuotes.map(q => {
        // Routing de polling:
        //   tipo "personalizado"        → /api/quotes/:folio    (quotesStore)
        //   tipo "cotizacion" | "pedido" → /api/checkout/:folio  (ordersStore)
        const tipo = q.tipo === 'personalizado' ? 'quote' : 'order';
        return syncEstadoFromServerRef.current(q.folio, tipo);
      }));
      // Recarga el snapshot desde Firestore
      await loadFromFirestore(user.email);
    };

    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleManualRefresh = async () => {
    if (!user?.email) return;
    setRefreshing(true);
    try {
      await loadFromFirestore(user.email);
    } finally {
      setRefreshing(false);
    }
  };

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

  // ── Confirmar cancelación desde el modal ──────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!confirmingCancel) return;
    const folio = confirmingCancel.folio;

    setCancellingFolio(folio);
    setCancelErrors(prev => {
      const next = { ...prev };
      delete next[folio];
      return next;
    });

    try {
      await cancelQuote(folio);
      // Éxito: la tarjeta se va por el filtro y AnimatePresence dispara el exit.
      setConfirmingCancel(null);
    } catch (err) {
      // Rollback ya fue aplicado por cancelQuote — la tarjeta se queda visible.
      setCancelErrors(prev => ({
        ...prev,
        [folio]: err.message || 'No se pudo cancelar la solicitud.',
      }));
      setConfirmingCancel(null);
    } finally {
      setCancellingFolio(null);
    }
  };

  if (!user) return null;

  // Excluir canceladas del expediente — quedan solo en Firestore por auditoría.
  const myQuotes = quotes.filter(q => {
    const email = q.clienteEmail || q.cliente?.email;
    return email === user.email && q.estado !== 'cancelada';
  });

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
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  {myQuotes.length} registro{myQuotes.length !== 1 ? 's' : ''}
                </span>
              )}
              <button onClick={handleManualRefresh} disabled={loading || refreshing}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all disabled:opacity-40"
                title="Refrescar expediente">
                <FiRefreshCw className={`text-xs ${(loading || refreshing) ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </h3>

            {/* Error de Firestore — degradación graceful */}
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs">
                <FiAlertCircle className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No se pudo sincronizar con Firestore.</p>
                  <p className="opacity-80">Mostrando expediente en caché local. Verifica tu conexión.</p>
                </div>
              </div>
            )}

            {/* Loading skeleton (solo carga inicial sin caché) */}
            {loading && myQuotes.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : myQuotes.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FiPackage className="text-5xl mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 text-sm mb-4">No tienes solicitudes aún.</p>
                <Link to="/catalogo" className="inline-block px-6 py-2 bg-white border border-slate-200 text-blue-600 rounded-full font-bold shadow-sm hover:shadow-md transition-shadow">
                  Iniciar Nueva Cotización
                </Link>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  {myQuotes.map(q => {
                    const estado     = ESTADO_LABEL[q.estado] || ESTADO_LABEL.nueva;
                    const cliente    = getCliente(q);
                    const cancelable = q.estado === 'nueva';
                    const isCancelling = cancellingFolio === q.folio;
                    const cancelErr  = cancelErrors[q.folio];

                    return (
                      <motion.div
                        key={q.folio}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-black text-slate-800 font-outfit text-sm">{q.folio}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{TIPO_LABEL[q.tipo] || q.tipo}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${estado.color}`}>
                              {estado.label}
                            </span>
                            {q.syncedToBind ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <FiCheck className="text-xs" /> Recibido por ventas
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                                Pendiente sync
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <FiClock className="text-slate-400" />
                            <span>{q.fecha ? new Date(q.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                          </div>
                          {q.productos?.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <FiPackage className="text-slate-400" />
                              <span>{q.productos.length} producto{q.productos.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {(q.subtotal || q.totalIVA) && (
                            <div className="font-bold text-blue-700">
                              ${(q.totalIVA || (q.subtotal || 0) * 1.16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
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

                        {q.bindFolioId && (
                          <p className="text-[10px] text-slate-400 mt-2 font-mono">
                            ID Bind: <span className="font-bold text-slate-600">{q.bindFolioId}</span>
                          </p>
                        )}

                        {/* Botón Cancelar — solo si estado === 'nueva' */}
                        {cancelable && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setConfirmingCancel(q)}
                              disabled={isCancelling}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                         border border-red-200 text-red-600 hover:bg-red-50
                                         text-xs font-bold transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCancelling ? (
                                <>
                                  <span className="w-3 h-3 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                                  Cancelando…
                                </>
                              ) : (
                                <>
                                  <FiTrash2 className="text-xs" />
                                  Cancelar solicitud
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Error inline tras un intento fallido (ej. 409 "ya en proceso") */}
                        {cancelErr && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                            <FiAlertCircle className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-bold">No se pudo cancelar.</p>
                              <p className="opacity-80">{cancelErr}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCancelErrors(prev => {
                                const next = { ...prev };
                                delete next[q.folio];
                                return next;
                              })}
                              className="text-red-400 hover:text-red-600"
                              aria-label="Cerrar"
                            >
                              <FiX />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal de confirmación de cancelación ─────────────────────────── */}
      <AnimatePresence>
        {confirmingCancel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => { if (!cancellingFolio) setConfirmingCancel(null); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <motion.div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
                  <FiXCircle className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 id="cancel-modal-title" className="font-black font-outfit text-xl text-slate-900 leading-tight">
                    ¿Cancelar esta solicitud?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
                <p className="font-black text-slate-800 font-outfit text-sm">
                  {confirmingCancel.folio}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {TIPO_LABEL[confirmingCancel.tipo] || confirmingCancel.tipo}
                  {(confirmingCancel.totalIVA || confirmingCancel.subtotal) && (
                    <>
                      {' · '}
                      <span className="font-bold text-blue-700">
                        ${(confirmingCancel.totalIVA || (confirmingCancel.subtotal || 0) * 1.16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(null)}
                  disabled={!!cancellingFolio}
                  className="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700
                             font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={!!cancellingFolio}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                             bg-red-600 hover:bg-red-700 text-white font-bold text-sm
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {cancellingFolio ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-red-200 border-t-white animate-spin" />
                      Cancelando…
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="text-sm" />
                      Sí, cancelar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
