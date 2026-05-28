// ─────────────────────────────────────────────────────────────────────────────
// jsonStore — persistencia simple en archivos JSON locales para los stores
// in-memory de cotizaciones/pedidos. NO es una BD: pensado como caché que
// sobrevive a reinicios del servidor (npm restart, deploy, crash).
//
// Limitaciones conocidas:
// - Escrituras síncronas (bloquean el event loop) → OK para volumen B2B bajo.
// - No es seguro entre múltiples procesos Node (cluster mode necesita BD real).
// - Sin atomicidad: un crash exacto durante writeFileSync puede truncar el
//   archivo. Para producción crítica, sustituir por SQLite/Postgres.
// ─────────────────────────────────────────────────────────────────────────────
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, '..', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Lee un array desde /server/data/<filename>. Devuelve [] si el archivo no
 * existe o el contenido está corrupto (no rompe el boot del servidor).
 */
export function loadStore(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try {
    const raw    = fs.readFileSync(filepath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[jsonStore] ${filename} no es un array; ignorando.`);
      return [];
    }
    console.log(`[jsonStore] ${filename} cargado (${parsed.length} registros).`);
    return parsed;
  } catch (err) {
    console.error(`[jsonStore] No se pudo leer ${filename}:`, err.message);
    return [];
  }
}

/**
 * Escribe el array completo a /server/data/<filename>. Crea el directorio
 * si no existe. Errores se loguean pero no se propagan: la persistencia
 * es best-effort, los datos siguen vivos en memoria mientras corre el server.
 */
export function saveStore(filename, data) {
  try {
    ensureDir();
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[jsonStore] No se pudo guardar ${filename}:`, err.message);
  }
}
