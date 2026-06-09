// ─────────────────────────────────────────────────────────────────────────────
// logoStorage — guarda imágenes base64 en /server/uploads/{folio}.{ext}
// Solo usa el `fs` nativo de Node (sin dependencias extra)
// ─────────────────────────────────────────────────────────────────────────────
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS    = path.join(__dirname, '..', 'uploads');
const MIME_TO_EXT = {
  'image/png':     'png',
  'image/jpeg':    'jpg',
  'image/jpg':     'jpg',
  'image/svg+xml': 'svg',
  'image/webp':    'webp',
  'image/gif':     'gif',
};

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
}

/**
 * Parsea un data URL `data:image/png;base64,iVBOR...` o un string base64 puro
 * y devuelve { buffer, ext }. Devuelve null si no puede parsear.
 */
function parseDataUrl(dataUrl, fallbackExt) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    const mime = match[1].toLowerCase();
    const data = match[2];
    return {
      buffer: Buffer.from(data, 'base64'),
      ext:    MIME_TO_EXT[mime] || fallbackExt || 'bin',
    };
  }

  // Plain base64 — usar ext del cliente o fallback
  try {
    return {
      buffer: Buffer.from(dataUrl, 'base64'),
      ext:    fallbackExt || 'png',
    };
  } catch {
    return null;
  }
}

/**
 * Guarda un logo en base64 al disco.
 * @returns string pública `/uploads/PLT-...ext` o null si nada que guardar.
 */
export function saveLogoBase64(folio, logoBase64, logoExt) {
  if (!folio || !logoBase64) return null;

  const parsed = parseDataUrl(logoBase64, logoExt);
  if (!parsed) {
    console.warn('[logoStorage] no se pudo parsear logoBase64 para', folio);
    return null;
  }

  try {
    ensureUploadsDir();
    const safeFolio = String(folio).replace(/[^A-Z0-9_-]/gi, '');
    const filename  = `${safeFolio}.${parsed.ext}`;
    const filepath  = path.join(UPLOADS, filename);
    fs.writeFileSync(filepath, parsed.buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[logoStorage] error al guardar logo:', err.message);
    return null;
  }
}

export const UPLOADS_DIR = UPLOADS;
