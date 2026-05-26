import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/apiFetch';
import {
  saveSolicitud, getSolicitudesByEmail, updateEstado,
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

  // ── Flow: enviar cotización personalizada ──────────────────────────────────
  // 1. POST /api/quotes  2. addQuote local  3. saveSolicitud en Firestore
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

    // Persistir en Firestore — falla silenciosa para no romper el flujo
    saveSolicitud(data.record, clienteEmail || payload?.cliente?.email)
      .catch(err => console.warn('[QuotesContext] Firestore save falló:', err.message));

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

    saveSolicitud(data.record, clienteEmail || payload?.cliente?.email)
      .catch(err => console.warn('[QuotesContext] Firestore save falló:', err.message));

    return data;
  }, [addQuote]);

  // ── Polling: detecta cambios de estado en el backend y los aplica a Firestore
  const syncEstadoFromServer = useCallback(async (folio, tipo /* 'quote' | 'order' */) => {
    if (!folio) return null;
    const endpoint = tipo === 'order' ? `/api/checkout/${folio}` : `/api/quotes/${folio}`;
    try {
      const res = await apiFetch(endpoint);
      if (!res.ok) return null;
      const data = await res.json();
      const remote = data?.record;
      if (!remote?.estado) return null;

      // Si el estado del backend difiere del local, actualizamos Firestore + local
      const local = quotes.find(q => q.folio === folio);
      if (local && local.estado !== remote.estado) {
        await updateEstado(folio, remote.estado).catch(() => {});
        updateQuote(folio, {
          estado:       remote.estado,
          syncedToBind: !!remote.syncedToBind,
          bindFolioId:  remote.bindFolioId || null,
        });
      }
      return remote;
    } catch (err) {
      console.warn('[QuotesContext] syncEstadoFromServer:', err.message);
      return null;
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
    }}>
      {children}
    </QuotesContext.Provider>
  );
}

export const useQuotes = () => useContext(QuotesContext);
