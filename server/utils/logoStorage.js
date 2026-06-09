// ─────────────────────────────────────────────────────────────────────────────
// logoStorage — guarda imágenes base64 en /server/uploads/{folio}.{ext}
// Solo usa el `fs` nativo de Node (sin dependencias extra)
// ─────────────────────────────────────────────────────────────────────────────
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS    = path.resolve(path.join(__dirname, '..', 'uploads'));

// SVG excluido: los navegadores ejecutan scripts en SVGs servidos directamente,
// lo que abre un vector de XSS almacenado contra cualquiera que visite la URL.
const MIME_TO_EXT = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/webp': 'webp',
  'image/gif':  'gif',
};

// Extensiones permitidas (allowlist). Debe estar en sincronía con MIME_TO_EXT.
const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'webp', 'gif']);

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

  // Plain base64 — usar ext del cliente solo si está en la allowlist
  try {
    const ext = ALLOWED_EXTENSIONS.has(fallbackExt) ? fallbackExt : 'png';
    return {
      buffer: Buffer.from(dataUrl, 'base64'),
      ext,
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

    // Vuln-fix 1: doble barrera contra path traversal.
    // (a) La extensión ya viene validada por ALLOWED_EXTENSIONS en parseDataUrl.
    // (b) Resolvemos el path final y verificamos que quede dentro de UPLOADS.
    const safeExt  = ALLOWED_EXTENSIONS.has(parsed.ext) ? parsed.ext : 'png';
    const filename = `${safeFolio}.${safeExt}`;
    const filepath = path.resolve(path.join(UPLOADS, filename));

    if (!filepath.startsWith(UPLOADS + path.sep) && filepath !== UPLOADS) {
      console.error('[logoStorage] path traversal bloqueado para folio', folio);
      return null;
    }

    fs.writeFileSync(filepath, parsed.buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[logoStorage] error al guardar logo:', err.message);
    return null;
  }
}

export const UPLOADS_DIR = UPLOADS;
