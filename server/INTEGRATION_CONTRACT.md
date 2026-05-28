# Integration Contract — Plastitaps E-commerce → Bind Automations

## Endpoints disponibles

| Método | Ruta                                | Descripción                                         | Auth requerida          |
|--------|-------------------------------------|-----------------------------------------------------|-------------------------|
| POST   | /api/quotes                         | Registrar cotización personalizada (diseño 3D)      | No                      |
| GET    | /api/quotes/:folio                  | Obtener estado actual (polling del frontend)        | No                      |
| PATCH  | /api/quotes/:folio/status           | Actualizar estado (webhook entrante de Bind)        | `X-Bind-Key`            |
| POST   | /api/checkout/send                  | Enviar cotización industrial del carrito            | No                      |
| GET    | /api/checkout/:folio                | Obtener estado actual (polling del frontend)        | No                      |
| PATCH  | /api/checkout/:folio/status         | Actualizar estado (webhook entrante de Bind)        | `X-Bind-Key`            |
| POST   | /api/contact                        | Formulario de contacto web                          | No                      |
| GET    | /uploads/{folio}.{ext}              | Logo adjunto del cliente (servido estáticamente)    | No                      |
| GET    | /api/health                         | Health check del servidor                           | No                      |

---

## Payloads

### POST /api/quotes

**Request body:**
```json
{
  "tipo": "personalizado",
  "cliente": {
    "nombre":   "Juan Pérez",
    "email":    "juan@empresa.com",
    "telefono": "3312345678",
    "empresa":  "Empresa S.A. de C.V.",
    "rfc":      "EMP123456T12"
  },
  "productos": [
    {
      "nombre":   "Vaso Personalizado",
      "cantidad": 500,
      "color":    "Azul Marino (#1e3a5f)",
      "tipo":     "diseño-personalizado"
    }
  ],
  "logoUrl":      "https://storage.googleapis.com/plastitaps-bucket/logos/PLT-20260525-XXXX.png",
  "pdfUrl":       null,
  "observaciones": "Fecha límite: 15 de junio. Impresión serigráfica."
}
```

**Response exitosa:**
```json
{
  "success": true,
  "folio":   "PLT-20260525-A3B7",
  "record": {
    "folio":         "PLT-20260525-A3B7",
    "tipo":          "personalizado",
    "estado":        "nueva",
    "fecha":         "2026-05-25T14:30:00.000Z",
    "cliente": {
      "nombre":   "Juan Pérez",
      "email":    "juan@empresa.com",
      "telefono": "3312345678",
      "empresa":  "Empresa S.A. de C.V.",
      "rfc":      "EMP123456T12"
    },
    "productos": [
      { "nombre": "Vaso Personalizado", "cantidad": 500, "color": "Azul Marino (#1e3a5f)", "tipo": "diseño-personalizado" }
    ],
    "logoUrl":       "https://storage.googleapis.com/plastitaps-bucket/logos/PLT-20260525-A3B7.png",
    "pdfUrl":        null,
    "observaciones": "Fecha límite: 15 de junio. Impresión serigráfica.",
    "syncedToBind":  false,
    "bindFolioId":   null
  }
}
```

---

### POST /api/checkout/send

**Request body:**
```json
{
  "cliente": {
    "nombre":   "Juan Pérez",
    "email":    "juan@empresa.com",
    "telefono": "3312345678",
    "empresa":  "Empresa S.A. de C.V.",
    "rfc":      "EMP123456T12"
  },
  "productos": [
    {
      "id":       "tapa-28mm-std",
      "name":     "Tapa 28mm Estándar",
      "category": "Tapas Diámetro Pequeño",
      "quantity": 50000,
      "unit":     "pz",
      "price":    0.3850
    },
    {
      "id":       "botella-pet-600",
      "name":     "Botella PET 600ml",
      "category": "Botellas",
      "quantity": 10000,
      "unit":     "pz",
      "price":    2.1500
    }
  ],
  "totalPrice": 40750.00,
  "totalIVA":   47270.00
}
```

**Response exitosa:**
```json
{
  "success": true,
  "folio":   "PLT-20260525-C9D2",
  "record": {
    "folio":     "PLT-20260525-C9D2",
    "tipo":      "cotizacion",
    "estado":    "nueva",
    "fecha":     "2026-05-25T15:00:00.000Z",
    "cliente": {
      "nombre":   "Juan Pérez",
      "email":    "juan@empresa.com",
      "telefono": "3312345678",
      "empresa":  "Empresa S.A. de C.V.",
      "rfc":      "EMP123456T12"
    },
    "productos": [
      { "id": "tapa-28mm-std", "name": "Tapa 28mm Estándar", "category": "Tapas Diámetro Pequeño", "quantity": 50000, "unit": "pz", "price": 0.3850 },
      { "id": "botella-pet-600", "name": "Botella PET 600ml", "category": "Botellas", "quantity": 10000, "unit": "pz", "price": 2.1500 }
    ],
    "subtotal":     40750.00,
    "totalIVA":     47270.00,
    "logoUrl":      null,
    "pdfUrl":       null,
    "observaciones": "",
    "syncedToBind": false,
    "bindFolioId":  null
  }
}
```

---

### POST /api/contact

**Request body:**
```json
{
  "nombre":  "Juan Pérez",
  "email":   "juan@empresa.com",
  "asunto":  "Cotización",
  "mensaje": "Me gustaría recibir una cotización para 100,000 tapas 28mm."
}
```

**Response exitosa:**
```json
{ "success": true }
```

---

## Modelo de datos — Solicitud (QuotesContext / futuro BD)

```typescript
interface Solicitud {
  folio:         string;          // "PLT-YYYYMMDD-XXXX"
  tipo:          "cotizacion" | "pedido" | "personalizado";
  estado:        "nueva" | "revisada" | "contactado" | "aprobada" | "rechazada";
  fecha:         string;          // ISO 8601
  cliente: {
    nombre:   string;
    email:    string;
    telefono: string;
    empresa:  string;
    rfc:      string;             // máx 13 chars, uppercase
  };
  productos:     Producto[];
  logoUrl:       string | null;   // Firebase Storage URL
  pdfUrl:        string | null;
  observaciones: string;
  syncedToBind:  boolean;
  bindFolioId:   string | null;   // ID asignado por Bind Automations tras sincronización
}
```

---

## Autenticación

### Plastitaps API → Bind Automations (outbound)

El backend de Plastitaps hace POST a Bind con el header:
```
X-API-Key: <BIND_API_KEY>
Content-Type: application/json
```

Endpoints destino:
- Cotizaciones personalizadas → `POST {BIND_API_URL}/api/ecommerce/quote`
- Checkout industrial         → `POST {BIND_API_URL}/api/ecommerce/order`

**Respuesta esperada de Bind** (cualquiera de las dos formas):
```json
{ "bindFolioId": "BIND-2026-00123" }
```
o
```json
{ "id": "BIND-2026-00123" }
```

Si Bind devuelve status ≠ 2xx, el error se loguea y `syncedToBind` permanece en `false`. La cotización/pedido sigue persistido localmente para reintento manual. Si la respuesta es 2xx, el backend marca `syncedToBind: true` y guarda el `bindFolioId` en el store en memoria.

### Bind Automations → Plastitaps API (inbound webhook)

Bind notifica cambios de estado con:
```
PATCH /api/quotes/{folio}/status       (o /api/checkout/{folio}/status)
X-Bind-Key: <BIND_INCOMING_KEY>
Content-Type: application/json

{ "estado": "revisada" }
```

Estados válidos: `nueva`, `revisada`, `contactado`, `cotizada`, `aprobada`, `rechazada`.

El frontend hace polling cada 10s a `GET /api/quotes/:folio` (o `/api/checkout/:folio`), detecta el cambio de estado y lo persiste en Firestore (`updateEstado(folio, estado)`). Si el folio no existe en el store in-memory del backend (típico tras un reinicio), el endpoint `PATCH /:folio/status` lo **upserta** con `{ folio, estado, syncedToBind: true }` y responde 200 — el siguiente polling lo recoge y propaga a Firestore.

### Variables en `/server/.env`
```
BIND_API_URL=http://localhost:3000
BIND_API_KEY=plastitaps-bind-2026
BIND_INCOMING_KEY=bind-to-plastitaps-2026
```

---

## Eventos / Webhooks preparados

- **Nueva cotización recibida** — `POST /api/quotes` → notifica ventas@plastitaps.com + `sendToBind()` real + frontend guarda en Firestore
- **Checkout industrial enviado** — `POST /api/checkout/send` → notifica ventas@plastitaps.com + `sendToBind()` real + frontend guarda en Firestore
- **Cambio de estado (entrante)** — Bind hace `PATCH /api/quotes/:folio/status` (header `X-Bind-Key`); el frontend lo detecta vía polling y actualiza Firestore con `updateEstado(folio, nuevoEstado)`

---

## Persistencia y almacenamiento de logos

### Firestore — fuente de verdad para el cliente
El frontend persiste cada solicitud en la colección `solicitudes` de Firestore (Firebase v12), usando el `folio` como `documentId`. Esto permite que el cliente vea su expediente desde cualquier dispositivo y conserve el historial entre sesiones.

Estructura del documento:
```js
{
  folio:           "PLT-20260526-A3B7",
  tipo:            "cotizacion" | "pedido" | "personalizado",
  estado:          "nueva" | "revisada" | "contactado" | "cotizada" | "aprobada" | "rechazada",
  fecha:           Timestamp,
  clienteEmail:    string,    // para filtrar por cliente (Google OAuth)
  clienteNombre:   string,
  clienteEmpresa:  string,
  clienteTelefono: string,
  clienteRfc:      string,
  productos:       array,
  logoUrl:         string | null,  // ruta servida por backend: /uploads/PLT-xxx.png
  pdfUrl:          string | null,
  observaciones:   string,
  syncedToBind:    boolean,
  bindFolioId:     string | null,
  updatedAt:       Timestamp,
}
```

### Logos — guardado local en el servidor
Cuando el frontend envía un logo, lo manda como `logoBase64` (data URL) dentro del payload de `POST /api/quotes`. El backend:
1. Decodifica el base64 con `fs` nativo de Node
2. Lo guarda en `/server/uploads/{folio}.{ext}`
3. Devuelve `logoUrl: "/uploads/{folio}.ext"` en el record

`/server/uploads/` está en `.gitignore` y se sirve estáticamente con `express.static`. Bind puede acceder al logo via `GET {BACKEND_URL}/uploads/{folio}.{ext}`.

---

## Notas de integración

1. **Formato de folio**: `PLT-YYYYMMDD-XXXX` donde XXXX es un sufijo aleatorio de 4 chars base36 mayúscula. Generado en `/server/utils/folioGenerator.js`.

2. **Estado inicial**: Todas las solicitudes llegan con `estado: "nueva"`. Bind debe actualizar el estado vía `PATCH /api/{quotes|checkout}/:folio/status` según el flujo de negocio.

3. **`sendToBind()`** — implementado en `quotesService.js` y `checkoutService.js`. Hace `POST` real a Bind con `X-API-Key` y, en caso de respuesta exitosa, marca `syncedToBind: true` y guarda `bindFolioId` en el store en memoria.

4. **Polling del frontend**: `Account.jsx` hace polling cada 10 segundos a `GET /api/quotes/:folio` y `GET /api/checkout/:folio` para detectar cambios de estado producidos por el webhook entrante de Bind, y sincroniza Firestore vía `updateEstado()`.

5. **Rate limiting**: El servidor tiene límites por IP — cotizaciones: 20/15min, checkout: 10/15min, contacto: 5/15min. Bind debe implementar reintentos con backoff exponencial.

6. **SMTP**: El envío de correos usa Nodemailer. Si SMTP no está configurado, el sistema omite el envío sin fallar.

7. **Persistencia backend**: El store de cotizaciones del backend es en memoria — se borra al reiniciar el servidor. Firestore (frontend) actúa como persistencia primaria del cliente. Para flujos de negocio críticos, conectar `quotesService.js` y `checkoutService.js` a una BD.

8. **CORS**: El backend acepta `Content-Type`, `X-Bind-Key` y `X-API-Key` como headers permitidos. Los métodos `GET`, `POST`, `PATCH` y `OPTIONS` están habilitados.

9. **URL de producción**: El frontend usa `VITE_API_BASE_URL` (root `.env`). Vacío en dev → usa el proxy de Vite; en producción debe apuntar al dominio del backend.
