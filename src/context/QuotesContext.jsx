import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  saveSolicitud, getSolicitudesByEmail, getSolicitud,
  updateEstado, markSyncedToBind, cancelarSolicitud, eliminarSolicitud,
} from '../services/firestoreService';

// ─────────────────────────────────────────────────────────────────────────────
// QuotesContext — fuente única de verdad para cotizaciones del cliente.
// Firestore es la persistencia primaria; localStorage es solo caché de respaldo
// en caso de que Firestore esté offline.
// ─────────────────────────────────────────────────────────────────────────────
const QuotesContext = createContext();
const STORAGE_KEY   = 'plastitaps-quotes';

export function QuotesProvider({ children }) {
  const [quotes,  setQuotes]  = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Caché local para refrescar rápido al recargar
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes)); } catch {}
  }, [quotes]);

  // ── Acciones in-memory ─────────────────────────────────────────────────────
  const addQuote = useCallback((quote) => {
    setQuotes(prev => {
      if (prev.find(q => q.folio === quote.folio)) {
        return prev.map(q => q.folio === quote.folio ? { ...q, ...quote } : q);
      }
      return [quote, ...prev];
    });
  }, []);

  const updateQuote = useCallback((folio, updates) => {
    setQuotes(prev => prev.map(q => q.folio === folio ? { ...q, ...updates } : q));
  }, []);

  // ── Cargar historial desde Firestore para un email ─────────────────────────
  const loadFromFirestore = useCallback(async (email) => {
    if (!email) return [];
    setLoading(true);
    setError(null);
    try {
      const docs = await getSolicitudesByEmail(email);
      setQuotes(docs);
      return docs;
    } catch (err) {
      console.error('[QuotesContext] loadFromFirestore:', err);
      setError(err.message || 'No se pudo cargar el expediente.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Persiste el record en Firestore y, si el backend ya alcanzó a sincronizar
  // con Bind antes de responder, refuerza el flag syncedToBind/bindFolioId
  // con un updateDoc dedicado. Esto cambia el badge de "Pendiente sync" a
  // "✓ Recibido por ventas" en 1-2 segundos sin esperar al polling.
  const persistAndMaybeMarkSynced = (record, clienteEmail) => {
    (async () => {
      try {
        await saveSolicitud(record, clienteEmail);
        if (record?.syncedToBind && record?.folio) {
          await markSyncedToBind(record.folio, record.bindFolioId || null);
        }
      } catch (err) {
        console.warn('[QuotesContext] Firestore persist falló:', err.message);
      }
    })(); // fire-and-forget: no bloqueamos el return del flow
  };

  // ── Flow: enviar cotización personalizada ──────────────────────────────────
  // 1. POST /api/quotes  2. addQuote local  3. saveSolicitud en Firestore
  //    + markSyncedToBind si el record viene synced del backend.
  const submitQuote = useCallback(async (payload, clienteEmail) => {
    const res  = await apiFetch('/api/quotes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data?.success) {
      throw new Error(data?.error || 'Error al registrar la cotización.');
    }

    addQuote(data.record);
    persistAndMaybeMarkSynced(data.record, clienteEmail || payload?.cliente?.email);

    return data;
  }, [addQuote]);

  // ── Flow: enviar checkout industrial ───────────────────────────────────────
  const submitOrder = useCallback(async (payload, clienteEmail) => {
    const res  = await apiFetch('/api/checkout/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!data?.success) {
      throw new Error(data?.error || 'Error al enviar el pedido.');
    }

    addQuote(data.record);
    persistAndMaybeMarkSynced(data.record, clienteEmail || payload?.cliente?.email);

    return data;
  }, [addQuote]);

  // ── Flow: borrar solicitud (iniciado por webhook de Bind, no por el cliente) ─
  // El cliente NO tiene botón de borrar. Esto lo dispara el polling cuando el
  // backend reporta deleted:true (Bind eliminó la solicitud en su dashboard).
  //
  // NO llamamos al DELETE del backend: para cuando el polling detecta deleted:true,
  // Bind YA borró el folio del store/JSON (ese fue el evento que generó el flag).
  // Además ese endpoint está protegido con bindAuth (X-Bind-Key) que el frontend
  // no posee — llamarlo daría 401. Acá solo reflejamos el borrado donde el cliente
  // sí manda: Firestore (fuente de verdad del expediente) + estado local.
  //   1. eliminarSolicitud(folio) en Firestore.
  //   2. Remover del estado local → desaparece del expediente con su anim de salida.
  const deleteQuote = useCallback(async (folio) => {
    if (!folio) return;
    try {
      await eliminarSolicitud(folio);
      setQuotes(prev => prev.filter(q => q.folio !== folio));
    } catch (err) {
      // No removemos local: Firestore aún lo tiene y el loadFromFirestore del
      // tick lo restauraría igual (flicker). El tombstone del backend persiste,
      // así que el próximo poll reintenta eliminarSolicitud. Eventually consistent.
      console.error('[QuotesContext] deleteQuote (Firestore):', err.message);
    }
  }, []);

  // ── Polling: detecta cambios de estado en el backend y los aplica a Firestore
  // Estrategia:
  //   1. Consulta el backend (in-memory + JSON local) por el folio.
  //   2. Si el backend reporta deleted:true → Bind borró la solicitud → propagamos
  //      el borrado a Firestore + local vía deleteQuote y salimos.
  //   3. Si el backend tiene el record, compara estado vs local y propaga a Firestore.
  //   4. Si el backend devuelve record:null SIN flag deleted (folio viejo, server
  //      reiniciado y sin webhooks recientes), cae a getSolicitud(folio) en Firestore
  //      como fuente alternativa. Defensivo: cubre el caso reinicio/multi-tab y evita
  //      borrar datos por error (por eso distinguimos deleted:true de record:null).
  const syncEstadoFromServer = useCallback(async (folio, tipo /* 'quote' | 'order' */) => {
    if (!folio) return null;
    const endpoint = tipo === 'order' ? `/api/checkout/${folio}` : `/api/quotes/${folio}`;

    let remote = null;
    let deletedByBind = false;
    try {
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        remote = data?.record || null;
        deletedByBind = data?.deleted === true;
      }
    } catch (err) {
      console.warn('[QuotesContext] syncEstadoFromServer backend fetch:', err.message);
    }

    // Borrado intencional desde Bind → propagar y salir (NO caer a Firestore).
    if (deletedByBind) {
      await deleteQuote(folio);
      return null;
    }

    // Fallback a Firestore si el backend no tiene el folio (caso reinicio).
    if (!remote?.estado) {
      try {
        const fsDoc = await getSolicitud(folio);
        if (fsDoc?.estado) {
          remote = {
            estado:       fsDoc.estado,
            syncedToBind: !!fsDoc.syncedToBind,
            bindFolioId:  fsDoc.bindFolioId || null,
          };
        }
      } catch (err) {
        console.warn('[QuotesContext] syncEstadoFromServer Firestore fallback:', err.message);
      }
    }

    if (!remote?.estado) return null;

    // Si el estado de la fuente (backend o Firestore) difiere del local, propagar.
    const local = quotes.find(q => q.folio === folio);
    if (local && local.estado !== remote.estado) {
      await updateEstado(folio, remote.estado)
        .catch(err => console.warn('[QuotesContext] Firestore updateEstado falló:', err.message));
      // Solo propagamos syncedToBind/bindFolioId cuando el remoto los trae como
      // true. Si remote.syncedToBind viene false (típico: backend JSON con un
      // upsert mínimo creado tras reinicio, que perdió el flag de sincronización
      // que Firestore sí conserva), preservamos el valor local para no degradar
      // un badge "✓ Recibido por ventas" a "Pendiente sync" incorrectamente.
      // Firestore sigue siendo quien puede degradar el flag explícitamente vía
      // su propio camino (saveSolicitud / markSyncedToBind del flow de submit).
      updateQuote(folio, {
        estado: remote.estado,
        ...(remote.syncedToBind
          ? { syncedToBind: true, bindFolioId: remote.bindFolioId || null }
          : {}),
      });
    }
    return remote;
  }, [quotes, updateQuote, deleteQuote]);

  // ── Flow: cancelar solicitud ───────────────────────────────────────────────
  // Reglas de negocio:
  //   - Solo se puede cancelar si estado === 'nueva'.
  //   - Update optimista: marcamos local como 'cancelada' antes del round-trip.
  //   - Si el backend rechaza (409) o falla la red, rollback al estado previo.
  //   - Backend OK → escribimos a Firestore como confirmación durable.
  const cancelQuote = useCallback(async (folio) => {
    const current = quotes.find(q => q.folio === folio);
    if (!current) {
      throw new Error('Solicitud no encontrada en el expediente local.');
    }
    if (current.estado !== 'nueva') {
      throw new Error('Esta solicitud ya está siendo procesada. Contacta a ventas para cancelarla.');
    }

    const prevEstado = current.estado;

    // Optimistic: cambiar local de inmediato para que la animación de salida arranque.
    updateQuote(folio, { estado: 'cancelada' });

    try {
      // Routing por tipo, igual que en el polling.
      const path = current.tipo === 'personalizado' ? 'quotes' : 'checkout';
      const res  = await apiFetch(`/api/${path}/${folio}/cancel`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const msg = data?.error || `No se pudo cancelar (status ${res.status}).`;
        const err = new Error(msg);
        err.status = res.status;
        err.serverEstado = data?.estado;
        throw err;
      }

      // Backend OK → persistir a Firestore (best-effort).
      await cancelarSolicitud(folio).catch(err =>
        console.warn('[QuotesContext] cancelarSolicitud Firestore:', err.message)
      );
      return data;
    } catch (err) {
      // Rollback local: el optimistic update se revierte al estado previo.
      updateQuote(folio, { estado: prevEstado });
      throw err;
    }
  }, [quotes, updateQuote]);

  return (
    <QuotesContext.Provider value={{
      quotes,
      loading,
      error,
      addQuote,
      updateQuote,
      loadFromFirestore,
      submitQuote,
      submitOrder,
      syncEstadoFromServer,
      cancelQuote,
      deleteQuote,
    }}>
      {children}
    </QuotesContext.Provider>
  );
}

export const useQuotes = () => useContext(QuotesContext);
