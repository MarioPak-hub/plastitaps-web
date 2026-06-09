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
    productos:    productos    || [],
    logoUrl:      logoUrl      || null,
    pdfUrl:       pdfUrl       || null,
    observaciones: observaciones || '',
    syncedToBind: false,
    bindFolioId:  null,
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
    syncedToBind:  false,
    bindFolioId:   null,
  };
}
