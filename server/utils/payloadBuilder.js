import crypto from 'node:crypto';

/**
 * Genera un token secreto de 32 bytes (hex) para autenticar la cancelación.
 * Se incluye en la respuesta del POST y debe presentarse en el PATCH /cancel.
 * No se muestra en el historial ni se guarda en Firestore — vive solo en el
 * store in-memory del backend y en el localStorage del cliente (a través del
 * record que devuelve el POST).
 */
function generateCancelToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function buildQuotePayload({ folio, tipo = 'personalizado', cliente, productos, logoUrl, pdfUrl, observaciones }) {
  return {
    folio,
    tipo,
    estado: 'nueva',
    fecha: new Date().toISOString(),
    cliente: {
      nombre:   cliente.nombre   || '',
      email:    cliente.email    || '',
      telefono: cliente.telefono || '',
      empresa:  cliente.empresa  || '',
      rfc:      cliente.rfc      || '',
    },
    productos:     productos    || [],
    logoUrl:       logoUrl      || null,
    pdfUrl:        pdfUrl       || null,
    observaciones: observaciones || '',
    // Vuln-fix 4: token de un solo uso para autenticar la cancelación.
    // Solo el cliente que recibió la respuesta del POST lo conoce.
    cancelToken: generateCancelToken(),
  };
}

export function buildCheckoutPayload({ folio, cliente, productos, totalPrice, totalIVA }) {
  return {
    folio,
    tipo:   'cotizacion',
    estado: 'nueva',
    fecha:  new Date().toISOString(),
    cliente: {
      nombre:   cliente.nombre   || '',
      email:    cliente.email    || '',
      telefono: cliente.telefono || '',
      empresa:  cliente.empresa  || '',
      rfc:      cliente.rfc      || '',
    },
    productos:     productos  || [],
    subtotal:      totalPrice || 0,
    totalIVA:      totalIVA   || 0,
    logoUrl:       null,
    pdfUrl:        null,
    observaciones: '',
    // Vuln-fix 4: mismo mecanismo para pedidos de checkout.
    cancelToken: generateCancelToken(),
  };
}
