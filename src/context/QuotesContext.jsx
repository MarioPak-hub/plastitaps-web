import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  saveSolicitud, getSolicitudesByEmail,
  cancelarSolicitud,
} from '../services/firestoreService';

// ─────────────────────────────────────────────────────────────────────────────
// QuotesContext — fuente única de verdad para cotizaciones del cliente.
// Firestore es la persistencia primaria; localStorage es solo caché de respaldo
// en caso de que Firestore esté offline.
//
// Flujo: el cliente envía → el backend manda el correo a ventas y guardamos el
// registro en Firestore (historial). No hay integración con sistemas externos.
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

  // Persiste el record en Firestore (historial del cliente). Fire-and-forget:
  // no bloqueamos el return del flow de envío.
  const persistToFirestore = (record, clienteEmail) => {
    (async () => {
      try {
        await saveSolicitud(record, clienteEmail);
      } catch (err) {
        console.warn('[QuotesContext] Firestore persist falló:', err.message);
      }
    })();
  };

  // ── Flow: enviar cotización personalizada ──────────────────────────────────
  // 1. POST /api/quotes (backend manda el correo a ventas)
  // 2. addQuote local  3. saveSolicitud en Firestore (historial)
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
    persistToFirestore(data.record, clienteEmail || payload?.cliente?.email);
    // Vuln-fix 4: guardar el cancelToken en localStorage (nunca en Firestore)
    // para enviarlo como X-Cancel-Token al hacer PATCH /cancel.
    if (data.cancelToken && data.folio) {
      try { localStorage.setItem(`plt-cancel-${data.folio}`, data.cancelToken); } catch {}
    }

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
    persistToFirestore(data.record, clienteEmail || payload?.cliente?.email);
    if (data.cancelToken && data.folio) {
      try { localStorage.setItem(`plt-cancel-${data.folio}`, data.cancelToken); } catch {}
    }

    return data;
  }, [addQuote]);

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
      const path        = current.tipo === 'personalizado' ? 'quotes' : 'checkout';
      // Vuln-fix 4: leer el cancelToken del localStorage y enviarlo en el header.
      const cancelToken = (() => { try { return localStorage.getItem(`plt-cancel-${folio}`) || ''; } catch { return ''; } })();
      const res = await apiFetch(`/api/${path}/${folio}/cancel`, {
        method:  'PATCH',
        headers: { 'X-Cancel-Token': cancelToken },
      });
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
      cancelQuote,
    }}>
      {children}
    </QuotesContext.Provider>
  );
}

export const useQuotes = () => useContext(QuotesContext);
