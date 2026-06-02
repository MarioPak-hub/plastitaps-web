import { jsPDF } from 'jspdf';

const TERMS = [
  '1. No incluye envío fuera de la Zona Metropolitana de Guadalajara (ZMG).',
  '2. 50% de anticipo requerido para iniciar producción.',
  '3. No manejamos inventarios. Todo es fabricado sobre pedido.',
  '4. Cantidades, personalización y cotización se definen con un asesor de Plastitaps.',
];

export function generateQuotationPDF({ cart, user, folio }) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── HEADER BACKGROUND ──────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175); // blue-700
  doc.rect(0, 0, W, 42, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('PLASTITAPS', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fabricación de Tapas y Envases PET · FSCC 22000', 14, 25);
  doc.text('ventas@plastitaps.com · Tel: +52 33259625', 14, 31);

  // Folio + Date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cotización #${folio}`, W - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }), W - 14, 25, { align: 'right' });
  doc.text('Vigencia: 30 días naturales', W - 14, 31, { align: 'right' });

  // ── CLIENT SECTION ─────────────────────────────────────────────────────────
  let y = 52;
  // Row 1: Empresa + RFC
  const clientStartY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  // Row 1
  const row1Y = y + 6;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Empresa: ${user?.empresa || '—'}`, 18, row1Y);
  doc.text(`RFC: ${user?.rfc || '—'}`, 110, row1Y);
  // Row 2: Contacto + Email
  const row2Y = row1Y + 5;
  doc.text(`Contacto: ${user?.name || '—'}`, 18, row2Y);
  doc.text(`Email: ${user?.email || '—'}`, 110, row2Y);
  // Row 3: Dirección (con wrap dinámico)
  const row3Y = row2Y + 5;
  const direccionStr = `Dirección: ${user?.direccion || '—'}`;
  const maxDirWidth = 85; // mm
  const direccionLines = doc.splitTextToSize(direccionStr, maxDirWidth);
  doc.text(direccionLines, 18, row3Y);
  // Row 4: Teléfono (debajo de la dirección, nunca encimado)
  const dirHeight = direccionLines.length * 4;
  const row4Y = row3Y + dirHeight + 1;
  doc.text(`Teléfono: ${user?.telefono || '—'}`, 110, row3Y);
  // Dynamic client box height
  const clientBoxH = (row4Y - clientStartY) + 4;
  // Draw background behind (render before text would be ideal, but jsPDF layers are flat)
  // Redraw background
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, clientStartY - 5, W - 28, clientBoxH, 3, 3, 'F');
  // Re-render header label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text('DATOS DEL CLIENTE', 18, clientStartY);
  // Re-render all rows on top of background
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Empresa: ${user?.empresa || '—'}`, 18, row1Y);
  doc.text(`RFC: ${user?.rfc || '—'}`, 110, row1Y);
  doc.text(`Contacto: ${user?.name || '—'}`, 18, row2Y);
  doc.text(`Email: ${user?.email || '—'}`, 110, row2Y);
  doc.text(direccionLines, 18, row3Y);
  doc.text(`Teléfono: ${user?.telefono || '—'}`, 110, row3Y);
  y = clientStartY - 5 + clientBoxH;

  // ── PRODUCTS TABLE ─────────────────────────────────────────────────────────
  y += 14;
  // Head row
  doc.setFillColor(30, 64, 175);
  doc.rect(14, y, W - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const cols = { producto: 14, categoria: 120 };
  doc.text('PRODUCTO', cols.producto + 2, y + 5.5);
  doc.text('CATEGORÍA', cols.categoria + 2, y + 5.5);
  y += 8;

  cart.forEach((item, i) => {
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    doc.rect(14, y, W - 28, 9, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(item.name, cols.producto + 2, y + 6, { maxWidth: 100 });
    doc.text(item.category || '', cols.categoria + 2, y + 6);
    y += 9;
  });

  // Nota de asesoría (en lugar de totales)
  doc.setFillColor(219, 234, 254); // blue-100
  doc.rect(14, y, W - 28, 10, 'F');
  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175);
  doc.text('Cantidades y cotización a definir con un asesor de Plastitaps.', cols.producto + 2, y);

  // ── T&C ────────────────────────────────────────────────────────────────────
  y += 14;
  doc.setFillColor(254, 243, 199); // amber-50
  doc.roundedRect(14, y, W - 28, 40, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // amber-800
  doc.text('TÉRMINOS Y CONDICIONES', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  TERMS.forEach((line, i) => {
    doc.text(line, 18, y + 13 + i * 5.5);
  });

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('PLASTITAPS © 2026 · Todos los derechos reservados · ventas@plastitaps.com', W / 2, H - 5, { align: 'center' });

  return doc;
}
