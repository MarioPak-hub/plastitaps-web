# Desplegar Plastitaps en GoDaddy (hosting compartido cPanel)

El proyecto son **dos apps**:
- **Frontend** (React/Vite) → archivos estáticos. Va en `public_html`.
- **Backend** (Express/Node) → proceso Node. Solo corre en cPanel si tu plan tiene
  **"Setup Node.js App"**. Si no lo tiene, hospeda el backend en otro lado
  (Render / Railway) y deja solo el frontend en GoDaddy.

> ⚠️ Antes de nada: en cPanel busca el ícono **"Setup Node.js App"** (sección
> Software). Si **no aparece**, tu plan no corre Node → ve a la sección C.

---

## A) Frontend → public_html

1. En tu máquina, define la URL pública del backend y compila:
   ```bash
   # .env (raíz) — apunta al backend en producción:
   VITE_API_BASE_URL=https://api.TUDOMINIO.com
   npm run build
   ```
   Esto genera `dist/` (incluye el `.htaccess` para React Router).

2. En cPanel → **Administrador de archivos** → entra a `public_html`.
3. Sube **el contenido de `dist/`** (no la carpeta, su interior): `index.html`,
   `assets/`, imágenes, `.htaccess`, etc.
4. Listo: `https://TUDOMINIO.com` ya muestra el sitio.

---

## B) Backend → Setup Node.js App (si tu cPanel lo tiene)

1. Sube la carpeta `server/` a un directorio FUERA de public_html, p.ej.
   `/home/USUARIO/plastitaps-api/` (incluye `server/` completo MENOS `node_modules`).
2. cPanel → **Setup Node.js App** → **Create Application**:
   - **Node version**: 18 o superior
   - **Application mode**: Production
   - **Application root**: `plastitaps-api`
   - **Application startup file**: `index.js`
   - **Application URL**: crea/usa un subdominio → `api.TUDOMINIO.com`
3. En esa misma pantalla agrega las **Environment Variables** (las de `server/.env`):
   `OPENAI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
   `SMTP_PASS`, `EMAIL_FROM`, `CONTACT_TO`, `BIND_API_URL`, `BIND_API_KEY`,
   `BIND_INCOMING_KEY`, y **`FRONTEND_URL=https://TUDOMINIO.com`** (para el CORS).
4. Pulsa **Run NPM Install** y luego **Restart**.
5. Prueba: `https://api.TUDOMINIO.com/api/health` debe responder `{"status":"ok"}`.

Con esto el frontend (compilado con `VITE_API_BASE_URL=https://api.TUDOMINIO.com`)
llamará a `https://api.TUDOMINIO.com/api/quotes`, etc.

---

## C) Si tu cPanel NO tiene Node.js App

El backend no puede correr en GoDaddy compartido. Opción recomendada:
- Sube **solo el frontend** a `public_html` (sección A).
- Hospeda `server/` en **Render.com** o **Railway.app** (gratis/barato, soportan
  Node + variables de entorno). Te dan una URL como `https://plastitaps-api.onrender.com`.
- Compila el frontend con `VITE_API_BASE_URL=https://plastitaps-api.onrender.com`.

---

## Notas / posibles problemas

- **SMTP**: GoDaddy a veces bloquea SMTP saliente a Gmail (puerto 465). Si los
  correos no salen, usa el relay SMTP de GoDaddy o un servicio (SendGrid/Resend).
- **Subidas de logos**: el backend guarda en `server/uploads/`. En cPanel esa
  carpeta persiste; en Render usa disco efímero (se borra al redeploy).
- **Webhooks de Bind**: el dashboard de Bind (`bind-automations`) es OTRA app
  (Next + Express) — no cabe en hosting compartido; va en VPS/Render aparte. En
  su `.env`, `PLASTITAPS_API_URL` debe apuntar a `https://api.TUDOMINIO.com`.
- **Firebase / Stripe**: son del lado cliente, ya quedan dentro del build.
