# Integration Contract — Plastitaps E-commerce → Bind Automations

## Endpoints disponibles

| Método | Ruta                  | Descripción                                         | Auth requerida          |
|--------|-----------------------|-----------------------------------------------------|-------------------------|
| POST   | /api/quotes           | Registrar cotización personalizada (diseño 3D)      | Bearer Token (futuro)   |
| POST   | /api/checkout/send    | Enviar cotización industrial del carrito            | Bearer Token (futuro)   |
| POST   | /api/contact          | Formulario de contacto web                          | No                      |
| GET    | /api/health           | Health check del servidor                           | No                      |

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

**Plastitaps API → Bind Automations** (outbound)

El backend de Plastitaps hace POST a Bind con el header:
```
X-API-Key: <BIND_API_KEY>
Content-Type: application/json
```

Endpoints destino:
- Cotizaciones personalizadas → `POST {BIND_API_URL}/api/ecommerce/quote`
- Checkout industrial         → `POST {BIND_API_URL}/api/ecommerce/order`

Variables en `/server/.env`:
```
BIND_API_URL=http://localhost:3000
BIND_API_KEY=plastitaps-bind-2026
```

**Respuesta esperada de Bind** (cualquiera de las dos formas):
```json
{ "bindFolioId": "BIND-2026-00123" }
```
o
```json
{ "id": "BIND-2026-00123" }
```

Si Bind devuelve status ≠ 2xx, el error se loguea y `syncedToBind` permanece en `false`. La cotización/pedido sigue persistido localmente para reintento manual.

---

## Eventos / Webhooks preparados

- **Nueva cotización recibida** — dispara `POST /api/quotes` → notifica ventas@plastitaps.com + stub `sendToBind()`
- **Checkout industrial enviado** — dispara `POST /api/checkout/send` → notifica ventas@plastitaps.com + stub `sendToBind()`
- **Cambio de estado** (futuro) — Bind puede hacer `PATCH /api/quotes/:folio/status` para actualizar estado en el expediente del cliente

---

## Notas de integración

1. **Formato de folio**: `PLT-YYYYMMDD-XXXX` donde XXXX es un sufijo aleatorio de 4 chars base36 mayúscula. Generado en `/server/utils/folioGenerator.js`.

2. **Firebase Storage**: Los logos subidos por los clientes viven en `gs://[bucket]/logos/[folio].[ext]`. Bind puede usar directamente la URL pública que devuelve `record.logoUrl`.

3. **Estado inicial**: Todas las solicitudes llegan con `estado: "nueva"`. Bind debe actualizar el estado a `"revisada"` cuando el equipo de ventas la revisa, y así sucesivamente por el flujo de negocio.

4. **`sendToBind()`**: Actualmente es un stub en `quotesService.js` y `checkoutService.js` que solo loguea el payload. Implementar la llamada HTTP real cuando Bind provea el endpoint y credenciales.

5. **Rate limiting**: El servidor tiene límites por IP — cotizaciones: 20/15min, checkout: 10/15min, contacto: 5/15min. Bind debe implementar reintentos con backoff exponencial.

6. **SMTP**: El envío de correos usa Nodemailer. Las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` deben configurarse en `/server/.env`. Si SMTP no está configurado, el sistema omite el envío de correo sin fallar.

7. **Persistencia**: Actualmente en memoria (reinicia con el servidor). Para producción, conectar a una base de datos (MongoDB/PostgreSQL) en `quotesService.js` y `checkoutService.js`.
