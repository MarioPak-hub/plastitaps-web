// ─────────────────────────────────────────────────────────────────────────────
// loadEnv — DEBE importarse antes que cualquier otro módulo del backend.
//
// Carga el .env contiguo (server/.env) por ruta absoluta, sin importar desde qué
// directorio se arranque el proceso. Así `npm run server` (cwd = raíz del repo) y
// `node index.js` (cwd = server/) ven las mismas variables de backend:
// OPENAI_API_KEY, SMTP_*, CONTACT_TO.
//
// Va en su propio módulo (no inline en index.js) porque ESM evalúa los `import`
// en orden de aparición antes de ejecutar cualquier sentencia: módulos como
// routes/chat.js instancian `new OpenAI()` a nivel de módulo y necesitan que las
// variables ya estén en process.env en ese momento. dotenv no sobreescribe lo que
// Node ya haya cargado vía --env-file.
// ─────────────────────────────────────────────────────────────────────────────
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
