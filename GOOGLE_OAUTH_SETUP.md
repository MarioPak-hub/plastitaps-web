# Google OAuth 2.0 — Configuración para Plastitaps E-commerce

## Problema: Error 400 `origin_mismatch`

Este error ocurre cuando el dominio/puerto desde donde se ejecuta la app NO está registrado en la configuración OAuth de Google Cloud Console.

Las cuentas **institucionales** (como TecMM) fallan porque Google aplica políticas más estrictas de verificación de origen para organizaciones.

---

## Solución: Configurar Google Cloud Console

### Paso 1: Acceder a Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar el proyecto que contiene el Client ID: `147191955716-...`
3. Ir a **APIs & Services → Credentials**
4. Hacer clic en el Client ID OAuth 2.0

### Paso 2: Authorized JavaScript Origins

Agregar **TODOS** los siguientes orígenes (sin trailing slash):

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:5174
```

> **Nota:** Vite puede usar puertos alternativos (5174, 5175) si el 5173 está ocupado. Agrega varios para evitar problemas.

Para **producción**, agregar también:
```
https://tu-dominio.com
https://www.tu-dominio.com
```

### Paso 3: Authorized Redirect URIs

Agregar los mismos dominios como redirect URIs:

```
http://localhost:5173
http://localhost:5174
http://localhost:5175
http://127.0.0.1:5173
http://127.0.0.1:5174
```

Para **producción**:
```
https://tu-dominio.com
https://www.tu-dominio.com
```

### Paso 4: OAuth Consent Screen (CRÍTICO para cuentas institucionales)

1. Ir a **APIs & Services → OAuth consent screen**
2. Verificar que **User Type** sea **External** (no Internal)
   - "Internal" solo permite cuentas del mismo dominio de la organización que creó el proyecto
   - "External" permite cualquier cuenta Google (personal e institucional)

3. Si la app está en modo **"Testing"**:
   - Agregar manualmente los emails institucionales (ej: `usuario@tecmm.edu.mx`) en la sección **Test Users**
   - O cambiar el estado de publicación a **"In Production"** para permitir cualquier cuenta

4. Asegurarse de que los **scopes** incluyan al menos:
   - `openid`
   - `email`
   - `profile`

### Paso 5: Verificar en el código

El archivo `.env` ya contiene el Client ID correcto:
```
VITE_GOOGLE_CLIENT_ID=147191955716-4r7qrn2urq43fhbcll019ngntr64bj6r.apps.googleusercontent.com
```

El archivo `vite.config.js` ya tiene los headers COOP correctos:
```js
'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
'Cross-Origin-Embedder-Policy': 'unsafe-none',
```

**No se requieren cambios en el código del frontend.**

---

## Troubleshooting

### Error: "No puedes iniciar sesión en esta aplicación"
- La app está en modo "Testing" y el email no está en la lista de test users
- Solución: Agregar el email o publicar la app

### Error: `origin_mismatch`
- El origen actual (ej: `http://localhost:5174`) no está en JavaScript Origins
- Solución: Agregar el origen exacto (incluyendo puerto)

### Error: `redirect_uri_mismatch`
- La redirect URI no coincide con las registradas
- Solución: Agregar la URI exacta en Authorized Redirect URIs

### Las cuentas personales funcionan pero las institucionales no
- Verificar que User Type sea "External"
- Si es "Testing", agregar los emails institucionales como test users
- Verificar que el dominio institucional no bloquee apps externas (esto depende del admin de IT del TecMM)

---

## Checklist Final

- [ ] JavaScript Origins incluye `http://localhost:5173` y `http://localhost:5174`
- [ ] JavaScript Origins incluye `http://127.0.0.1:5173` y `http://127.0.0.1:5174`
- [ ] Redirect URIs contiene los mismos orígenes
- [ ] OAuth consent screen tipo: **External**
- [ ] App en estado **Production** (o emails agregados como test users)
- [ ] Scopes: `openid`, `email`, `profile`
- [ ] Para producción: dominio HTTPS agregado a ambas listas
