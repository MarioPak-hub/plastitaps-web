# Plastitaps E-commerce Redesign

Este es el repositorio principal del rediseño del e-commerce de **Plastitaps**. Este proyecto está diseñado con una arquitectura cliente-servidor (Frontend en React + Backend en Node.js/Express) enfocada en proporcionar una experiencia de usuario interactiva y de alto rendimiento.

El propósito de este documento es detallar la estructura y funcionamiento del proyecto para que cualquier Inteligencia Artificial (o desarrollador) pueda comprenderlo rápidamente y ayudar en su evolución, resolución de problemas o añadir nuevas funcionalidades.

---

## 🚀 Tecnologías Principales (Stack)

### Frontend (Cliente)
Ubicado en la carpeta raíz y `src/`.
- **Framework Core**: React 19, React DOM 19, Vite (Bundler).
- **Enrutamiento**: React Router DOM v7.
- **Estilos**: Tailwind CSS, PostCSS, Framer Motion (Animaciones complejas), Anime.js, clsx, tailwind-merge.
- **Gráficos 3D**: Three.js, @react-three/fiber, @react-three/drei. (Visualización de productos en 3D interactivos).
- **Integraciones de Pagos**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Autenticación**: Google OAuth (`@react-oauth/google`).
- **Formularios y Validación**: React Hook Form, Zod.
- **Gestión del Estado/Cookies**: js-cookie, Context API nativa de React.
- **Otros**: Swiper (Carruseles), jsPDF (Generación de PDFs), DOMPurify (Sanitización HTML), React Confetti.

### Backend (Servidor)
Ubicado en la carpeta `server/`.
- **Entorno**: Node.js v20+ (Utiliza el flag nativo `--env-file` o el paquete `dotenv`).
- **Framework Core**: Express 5.
- **IA/Chatbot**: Integración con el SDK de OpenAI (`openai`).
- **Seguridad y Utilidades**: CORS, express-rate-limit (para prevenir abuso de APIs, especialmente el chatbot).

---

## 📂 Estructura de Directorios

### 1. `/src` (Frontend)
Contiene todo el código fuente de la aplicación React.
- **`/components`**: Componentes reutilizables de UI. Destacan:
  - `FloatingChatbot.jsx`: Interfaz del asistente virtual integrado.
  - Componentes 3D: `ProductModel3D.jsx`, `VasoViewer3D.jsx`, `Canvas3DErrorBoundary.jsx` para el visor interactivo de productos.
  - E-commerce Core: `Cart.jsx`, `ProductModal.jsx`, `Navbar.jsx`, `Footer.jsx`.
- **`/pages`**: Vistas completas renderizadas por React Router.
  - `Home.jsx`, `Catalog.jsx`, `InteractiveDesign.jsx`, `Promocionales.jsx` (Catálogo y navegación).
  - `Checkout.jsx`, `CarritoCheckout.jsx`, `StripeCheckout.jsx`, `PagoExitoso.jsx` (Flujo de compra).
  - `Login.jsx`, `Account.jsx`, `CompleteProfile.jsx` (Autenticación de usuarios).
  - `Contact.jsx` (Información de contacto).
- **`/context`**: Proveedores de estado global (Ej. Carrito de compras, Autenticación).
- **`/data`**: Archivos de datos estáticos (Ej. `products.json` que actúa como base de datos de productos si no hay un headless CMS/DB).
- **`/utils`**: Funciones de ayuda y formateadores.
- **`App.jsx` & `main.jsx`**: Puntos de entrada y configuración global de React y Router.
- **`index.css`**: Archivo principal de estilos Tailwind.

### 2. `/server` (Backend)
Contiene la API Node.js/Express.
- **`index.js`**: Punto de entrada del servidor de Express.
- **`/routes`**: Controladores de rutas de la API. (Ej. `chat.js` maneja los endpoints para la comunicación del frontend con OpenAI).
- **`/config`**: Archivos de configuración (Ej. inicialización de variables de entorno de OpenAI o Stripe).
- **`/middleware`**: Middlewares de Express (Validaciones, Rate limiting).

### 3. Raíz del Proyecto
- **`vite.config.js`**: Configuración de Vite.
- **`tailwind.config.js` & `postcss.config.js`**: Configuración del motor de estilos.
- **`package.json`**: Dependencias y scripts de ejecución globales.

---

## ⚙️ Scripts de Ejecución (`package.json` principal)

- `npm run dev`: Inicia el servidor de desarrollo del Frontend (Vite).
- `npm run server`: Inicia el servidor de backend.
- `npm run server:dev`: Inicia el servidor de backend en modo watch para que se reinicie automáticamente ante cambios.
- `npm run dev:full`: **Recomendado para desarrollo local**. Ejecuta tanto el frontend como el backend simultáneamente.
- `npm run build`: Construye la versión de producción del Frontend.

---

## 🧠 Integraciones Clave y Flujos de Trabajo

1. **Catálogo y 3D**: La plataforma se enfoca en ofrecer vistas 3D de los productos. Utiliza React Three Fiber para renderizar archivos GLTF/GLB de los envases.
2. **Chatbot Inteligente (Ventas)**: Existe un bot implementado en `FloatingChatbot.jsx` que se comunica con el servidor Node (`/server/routes/chat.js`), el cual a su vez actúa como proxy seguro hacia la API de OpenAI. El objetivo de este bot es ofrecer recomendaciones de productos de `products.json` y ayudar a cerrar ventas sin exponer las API keys de OpenAI al cliente.
3. **Flujo de Pago**: Se maneja un flujo de checkout que se integra con Stripe Components para el procesamiento seguro de tarjetas.
4. **Multimedia**: Se prevé o está en proceso el uso de Firebase Cloud Storage para alojar modelos 3D e imágenes pesadas con el fin de optimizar el rendimiento y la carga inicial (configurado por CORS para la lectura desde este dominio).

---

## 🤖 Cómo ayudar en este proyecto (Guía para la IA)

Si vas a interactuar con este proyecto para añadir features, corregir bugs o refactorizar:
1. **Considera la arquitectura**: Si una tarea requiere secretos (API Keys, llaves privadas), *siempre* colócalo en el directorio `/server` y crea un endpoint de la API. El frontend (`/src`) jamás debe tener variables de entorno sensibles en producción.
2. **Estilos**: Utiliza **Tailwind CSS** estrictamente. Evita crear archivos CSS personalizados a menos que sea para animaciones keyframes muy específicas o directivas globales que no puedan lograrse con las utilidades de Tailwind.
3. **Animaciones**: Utiliza Framer Motion para transiciones de componentes de React.
4. **Contexto 3D**: Cualquier cambio que afecte el visor en 3D debe probarse cuidadosamente para no afectar el rendimiento web (WebGL).
5. **Variables de entorno**: Existen 2 archivos `.env`. Uno en la raíz (para variables `VITE_` del frontend) y uno en `/server/.env` (para variables del backend como `OPENAI_API_KEY`).