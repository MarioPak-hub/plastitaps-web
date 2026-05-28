// ─────────────────────────────────────────────────────────────────────────────
// Firestore service — colección `solicitudes`
// Documento id = folio (PLT-YYYYMMDD-XXXX) para idempotencia
// ─────────────────────────────────────────────────────────────────────────────
import { db } from '../firebase';
import {
  collection, doc, setDoc, getDoc, deleteDoc,
  query, where, orderBy, getDocs, updateDoc, serverTimestamp,
} from 'firebase/firestore';

const COL = 'solicitudes';

/**
 * Normaliza un `record` (devuelto por el backend) al shape plano de Firestore.
 * Aplana los campos del cliente para poder filtrar por clienteEmail.
 */
function flattenRecord(record, clienteEmailOverride) {
  const c = record.cliente || {};
  return {
    folio:           record.folio,
    tipo:            record.tipo,
    estado:          record.estado || 'nueva',
    clienteEmail:    clienteEmailOverride || c.email || '',
    clienteNombre:   c.nombre   || '',
    clienteEmpresa:  c.empresa  || '',
    clienteTelefono: c.telefono || '',
    clienteRfc:      c.rfc      || '',
    productos:       record.productos || [],
    subtotal:        record.subtotal ?? null,
    totalIVA:        record.totalIVA ?? null,
    logoUrl:         record.logoUrl ?? null,
    pdfUrl:          record.pdfUrl  ?? null,
    observaciones:   record.observaciones || '',
    syncedToBind:    !!record.syncedToBind,
    bindFolioId:     record.bindFolioId || null,
  };
}

// ── Guardar nueva solicitud ──────────────────────────────────────────────────
export async function saveSolicitud(record, clienteEmail) {
  if (!record?.folio) throw new Error('saveSolicitud requiere record.folio');
  const ref     = doc(db, COL, record.folio);
  const payload = {
    ...flattenRecord(record, clienteEmail),
    fecha:     serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return record.folio;
}

// ── Obtener historial por cliente ────────────────────────────────────────────
export async function getSolicitudesByEmail(email) {
  if (!email) return [];
  try {
    const q = query(
      collection(db, COL),
      where('clienteEmail', '==', email),
      orderBy('fecha', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      // Convert Firestore Timestamp to ISO string for UI consumption
      return {
        id: d.id,
        ...data,
        fecha:     data.fecha?.toDate?.()?.toISOString()     || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });
  } catch (err) {
    console.error('[firestore] getSolicitudesByEmail:', err.message);
    throw err;
  }
}

// ── Obtener una solicitud puntual ────────────────────────────────────────────
export async function getSolicitud(folio) {
  if (!folio) return null;
  const ref  = doc(db, COL, folio);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    fecha:     data.fecha?.toDate?.()?.toISOString()     || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  };
}

// ── Actualizar estado (polling tras webhook de Bind) ─────────────────────────
export async function updateEstado(folio, estado) {
  if (!folio || !estado) return;
  const ref = doc(db, COL, folio);
  await updateDoc(ref, {
    estado,
    updatedAt: serverTimestamp(),
  });
}

// ── Marcar sincronización con Bind ───────────────────────────────────────────
export async function markSyncedToBind(folio, bindFolioId) {
  if (!folio) return;
  const ref = doc(db, COL, folio);
  await updateDoc(ref, {
    syncedToBind: true,
    bindFolioId:  bindFolioId || null,
    updatedAt:    serverTimestamp(),
  });
}

// ── Cancelar solicitud ──────────────────────────────────────────────────────
// Marca el documento como cancelado en Firestore. La validación de "solo se
// puede cancelar si estado === 'nueva'" vive en el cliente (QuotesContext) y
// en el backend (/cancel endpoint) — Firestore solo persiste el resultado final.
export async function cancelarSolicitud(folio) {
  if (!folio) return;
  const ref = doc(db, COL, folio);
  await updateDoc(ref, {
    estado:    'cancelada',
    updatedAt: serverTimestamp(),
  });
}

// ── Eliminar solicitud ──────────────────────────────────────────────────────
// Borra el documento de Firestore. Lo dispara el polling cuando detecta que
// Bind eliminó la solicitud en el backend (GET devuelve deleted:true). El
// cliente NO inicia borrados — solo puede cancelar.
export async function eliminarSolicitud(folio) {
  if (!folio) return;
  const ref = doc(db, COL, folio);
  await deleteDoc(ref);
}
