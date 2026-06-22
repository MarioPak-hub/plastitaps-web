import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import { FiCheckCircle, FiShield, FiX, FiExternalLink, FiArrowRight, FiBox, FiDroplet, FiArchive, FiGrid } from 'react-icons/fi';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import ScrollShowcase3D from '../components/ScrollShowcase3D';

/* ─── Categorías principales — acceso directo al catálogo filtrado ─── */
const MAIN_CATEGORIES = [
  {
    icon: FiBox,
    label: 'Tapas Plásticas',
    desc: 'Tapas para envases de diámetro pequeño, medio, grande y especializadas.',
    to: '/catalogo?categoria=tapas',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: FiDroplet,
    label: 'Envases PET y Botellas',
    desc: 'Botellas PET cristalinas, grado alimenticio y farmacéutico.',
    to: '/catalogo?categoria=botellas',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: FiArchive,
    label: 'Tarros y Envases Plásticos',
    desc: 'Contenedores y tarros plásticos para múltiples industrias.',
    to: '/catalogo?categoria=tarros',
    color: 'text-indigo-600 bg-indigo-50',
  },
  {
    icon: FiGrid,
    label: 'Soluciones de Empaque',
    desc: 'Catálogo completo de empaques plásticos para tu empresa.',
    to: '/catalogo',
    color: 'text-cyan-600 bg-cyan-50',
  },
];

/* ─── Datos para los modales de galería ─── */
const COLLAGE_CARDS = [
  {
    id: 'cromatica',
    img: '/collage_1.webp',
    badge: 'Tapas & Cierres',
    badgeColor: 'bg-blue-600',
    title: 'Variedad cromática a tu medida',
    desc: 'Fabricamos tapas en prácticamente cualquier color Pantone. Desde tonos corporativos hasta combinaciones personalizadas, adaptamos cada pieza a la identidad visual de tu marca con pigmentación de alta fidelidad y consistencia entre lotes.\n\nContamos con más de 50 colores estándar en inventario y la posibilidad de mezclar colores especiales bajo pedido mínimo.',
    tip: '¿No encuentras el color exacto? Te recomendamos solicitar una prueba de muestra sin costo antes de confirmar tu pedido.',
    cta: 'Solicitar muestra de color',
    ctaTo: '/contacto',
    external: false,
  },
  {
    id: 'eco',
    img: '/collage_4.webp',
    badge: 'Eco-friendly',
    badgeColor: 'bg-green-600',
    title: 'Compromiso real con el planeta',
    desc: 'En Plastitaps trabajamos con resinas recicladas y materiales de bajo impacto ambiental. Nuestros procesos de inyección están optimizados para minimizar el desperdicio de material y reducir el consumo energético en planta.\n\nTodos nuestros productos son 100% reciclables al final de su vida útil, y estamos en constante investigación de biopolímeros para futuros lanzamientos.',
    tip: null,
    cta: 'Hablar con un asesor',
    ctaTo: '/contacto',
    external: false,
  },
  {
    id: 'funcionalidad',
    img: '/collage_3.webp',
    badge: 'Funcionalidad',
    badgeColor: 'bg-blue-600',
    title: 'Cierres diseñados para funcionar',
    desc: 'Cada cierre que fabricamos pasa por pruebas de torque, presión y resistencia antes de salir de la planta. Nuestros flip-tops, disc-tops y tapas roscadas están diseñados ergonómicamente para facilitar el uso diario sin comprometer la hermeticidad.\n\nGarantizamos compatibilidad milimétrica con los envases estándar del mercado y también ofrecemos diseño exclusivo para medidas personalizadas.',
    tip: null,
    cta: 'Ver catálogo de cierres',
    ctaTo: '/catalogo',
    external: false,
  },
  {
    id: 'pet',
    img: '/collage_2.webp',
    badge: 'Envases PET',
    badgeColor: 'bg-emerald-600',
    title: 'Cristalinos, resistentes y certificados',
    desc: 'Nuestros envases PET ofrecen claridad óptica excepcional para que tu producto luzca tal como es. Fabricados con resina virgen de grado alimenticio y farmacéutico, cumplen con todas las normativas NOM y regulaciones internacionales.\n\nDisponibles en múltiples calibres, formas y capacidades — desde 30 ml hasta 5 litros. Personalizables en color, transparencia y acabado superficial.',
    tip: '¿Primera vez con envases PET? Te guiamos en la elección del calibre y la tapa ideal.',
    cta: 'Ver envases PET',
    ctaTo: '/catalogo',
    external: false,
  },
  {
    id: 'contenedores',
    img: '/collage_5.webp',
    badge: 'Contenedores',
    badgeColor: 'bg-indigo-600',
    title: 'Organización inteligente para cada industria',
    desc: 'Desde tarros cilíndricos hasta galones industriales, nuestra línea de contenedores plásticos ofrece soluciones de almacenamiento versátiles y herméticas. Compatibles con tapas de distintos diámetros.\n\nIdeales para alimentos secos, especias, químicos, cosméticos, farmacéuticos y más. Fabricados en PP y HDPE de alta resistencia química y mecánica.',
    tip: null,
    cta: 'Ver contenedores',
    ctaTo: '/catalogo',
    external: false,
  },
];

/* ─── Datos para los modales de certificación ─── */
const CERT_DATA = [
  {
    id: 'iso',
    img: '/iso_gold.webp',
    label: 'ISO 9001:2015',
    sub: 'Gestión de Calidad',
    badgeColor: 'bg-yellow-600',
    title: 'Certificación ISO 9001:2015',
    desc: 'La norma ISO 9001:2015 es el estándar internacional de sistemas de gestión de calidad más reconocido del mundo, adoptado por más de un millón de organizaciones en 170 países.\n\nEn Plastitaps, esta certificación garantiza que todos nuestros procesos — desde el diseño de moldes hasta la entrega del pedido — están controlados, documentados y en mejora continua. Significa que cada tapa y envase que producimos cumple criterios rigurosos de calidad auditados por un organismo independiente.',
    cta: 'Más sobre ISO 9001',
    ctaHref: 'https://www.iso.org/iso-9001-quality-management.html',
  },
  {
    id: 'ema',
    img: '/ema_logo.png',
    label: 'EMA',
    sub: 'Entidad Mexicana de Acreditación',
    badgeColor: 'bg-blue-700',
    title: 'Acreditación EMA',
    desc: 'La EMA (Entidad Mexicana de Acreditación) es el organismo nacional que evalúa y acredita la competencia técnica de laboratorios y organismos de certificación en México. Es miembro pleno de la ILAC y del IAF.\n\nNuestra acreditación ante la EMA valida que los organismos que nos certifican cumplen con los más altos estándares nacionales, reconocidos a nivel internacional. Es la garantía de que nuestra calidad no solo cumple con lo que decimos, sino que ha sido verificada por terceros independientes.',
    cta: 'Visitar EMA',
    ctaHref: 'https://www.ema.org.mx/',
  },
  {
    id: 'iaf',
    img: '/iaf_logo.png',
    label: 'IAF',
    sub: 'International Accreditation Forum',
    badgeColor: 'bg-slate-600',
    title: 'Miembro IAF',
    desc: 'El IAF (International Accreditation Forum) es el organismo mundial que coordina la acreditación de organismos de certificación en más de 100 países. Establece los requisitos que deben cumplir los acreditadores nacionales como la EMA.\n\nQue nuestra certificación ISO esté respaldada por un organismo miembro del IAF significa que es mutuamente reconocida en todos los países miembros — garantizando su validez para clientes y socios comerciales en cualquier parte del mundo.',
    cta: 'Visitar IAF',
    ctaHref: 'https://www.iaf.nu/',
  },
];

/* ─── Componente modal reutilizable ─── */
function InfoModal({ data, onClose, type }) {
  if (!data) return null;
  return (
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className={`relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden w-full ${type === 'gallery' ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
        >
          <FiX className="text-slate-600 text-lg" />
        </button>

        {type === 'gallery' ? (
          /* Gallery modal — imagen a la izquierda, texto a la derecha */
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="sm:w-2/5 h-48 sm:h-auto flex-shrink-0 relative">
              <img src={data.img} alt={data.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            {/* Content */}
            <div className="sm:w-3/5 p-7 flex flex-col gap-4">
              <span className={`self-start text-white text-xs font-bold px-3 py-1 rounded-full ${data.badgeColor}`}>{data.badge}</span>
              <h3 className="text-slate-800 font-black font-outfit text-xl leading-tight">{data.title}</h3>
              <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                {data.desc.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {data.tip && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-blue-700 text-xs leading-relaxed">
                  💡 <strong>Tip:</strong> {data.tip}
                </div>
              )}
              <Link
                to={data.ctaTo}
                onClick={onClose}
                className="mt-auto inline-flex items-center gap-2 self-start px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full transition-all"
              >
                {data.cta}
                <FiArrowRight />
              </Link>
            </div>
          </div>
        ) : (
          /* Cert modal — centrado */
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-24 h-24 flex items-center justify-center">
              <img src={data.img} alt={data.label} className="w-full h-full object-contain" />
            </div>
            <div>
              <span className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-3 ${data.badgeColor}`}>{data.label}</span>
              <h3 className="text-slate-800 font-black font-outfit text-xl leading-tight mb-1">{data.title}</h3>
              <p className="text-slate-500 text-xs">{data.sub}</p>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed space-y-3 text-left max-w-sm">
              {data.desc.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <a
              href={data.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full transition-all"
            >
              {data.cta}
              <FiExternalLink className="text-xs" />
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const slides = [
  {
    image: "/slide_excelencia.webp",
    title: "Excelencia en Inyección",
    subtitle: "Maquilamos tapas plásticas y envases PET con tecnología de punta y estándares internacionales para la industria moderna.",
    cta: "Explorar Tecnología"
  },
  {
    image: "/slide_pureza.webp",
    title: "Pureza Cristalina",
    subtitle: "Nuestros envases PET de grado farmacéutico y alimenticio garantizan la integridad visual y estructural de su producto en todo momento.",
    cta: "Ver Catálogo"
  },
  {
    image: "/slide_precision.webp",
    title: "Precisión Milimétrica",
    subtitle: "Tapas plásticas fabricadas con tolerancia cero a fugas. Proteja su contenido con cierres certificados e inviolables.",
    cta: "Solicitar Muestra"
  }
];

export default function Home({ openProductBySlug }) {
  const [galleryOpen, setGalleryOpen] = useState(null); // una de COLLAGE_CARDS
  const [certOpen, setCertOpen]       = useState(null); // una de CERT_DATA

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Seo
        title="Tapas Plásticas y Envases PET para tu Empresa"
        description="Fabricante mexicano de tapas plásticas, envases PET y soluciones de empaque certificadas ISO 9001. Proveedor de envases y empaques plásticos para la industria alimenticia, cosmética y farmacéutica."
        path="/"
      />
      <Navbar />

      {/* H1 único de la página — el hero rotativo usa h2 por slide para no duplicar H1 */}
      <h1 className="sr-only">
        Plastitaps — Fabricante de Tapas Plásticas y Envases PET en México
      </h1>

      {/* VIP Corporate Hero Slider */}
      <section className="relative h-[75vh] sm:h-[85vh] md:h-screen w-full pt-16 md:pt-20">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination, Navigation]}
          effect="fade"
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="h-full w-full shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)] overflow-hidden"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index} className="relative w-full h-full">
              {({ isActive }) => (
                <>
                  <div className="absolute inset-0 bg-slate-900/40 z-10" />
                  <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover z-0" />

                  <div className="absolute inset-0 z-20 flex items-center justify-center pt-10">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-center px-6 max-w-4xl"
                    >
                      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black font-outfit text-white mb-4 sm:mb-6 drop-shadow-md tracking-tight leading-tight">
                        {slide.title}
                      </h2>
                      <p className="text-sm sm:text-lg md:text-2xl text-slate-100 font-medium mb-6 sm:mb-10 max-w-3xl mx-auto drop-shadow-md">
                        {slide.subtitle}
                      </p>
                      <Link to="/catalogo">
                        <button className="px-6 sm:px-10 py-3 sm:py-4 bg-white hover:bg-slate-100 text-blue-700 font-bold rounded-full transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-base sm:text-lg">
                          {slide.cta}
                        </button>
                      </Link>
                    </motion.div>
                  </div>
                </>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── Categorías Principales ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-outfit text-slate-900 mb-3 tracking-tight">
              Proveedores de Envases y Soluciones de Empaque
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
              Encuentra tapas plásticas, envases PET y empaques plásticos fabricados bajo pedido para tu empresa.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {MAIN_CATEGORIES.map(({ icon: Icon, label, desc, to, color }) => (
              <Link
                key={label}
                to={to}
                className="group flex flex-col items-start p-5 sm:p-6 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="text-xl" />
                </div>
                <h3 className="font-bold font-outfit text-slate-800 text-base sm:text-lg leading-tight mb-1.5">{label}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4">{desc}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs sm:text-sm group-hover:gap-2.5 transition-all">
                  Ver productos <FiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nuestras Soluciones — Scroll 3D ── */}
      <ScrollShowcase3D />

      {/* ── Galería de Productos ── */}
      <section className="py-20 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full mb-5"
            >
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 text-xs font-bold uppercase tracking-widest">Nuestra Manufactura</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-slate-800 mb-4 leading-tight"
            >
              Calidad que se ve,{' '}
              <span className="text-blue-600">precisión que se siente</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto"
            >
              Desde la tapa más pequeña hasta el envase más robusto, cada pieza lleva la marca de nuestra excelencia industrial.
            </motion.p>
          </div>

          {/* Bento Grid – 3 cols × 3 rows flat CSS grid */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="grid gap-3"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
              height: '580px',
            }}
          >
            {/* 1 – Tapas de colores (grande: 2 cols × 2 filas) */}
            <div
              className="relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}
              onClick={() => setGalleryOpen(COLLAGE_CARDS[0])}
            >
              <img
                src="/collage_1.webp"
                alt="Tapas plásticas de colores"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-3 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">Tapas &amp; Cierres</span>
                <p className="text-white font-bold text-xl font-outfit leading-tight">Variedad cromática y técnica para cada aplicación</p>
              </div>
            </div>

            {/* 2 – Tapa eco / hoja (col 3, fila 1) */}
            <div
              className="relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ gridColumn: '3', gridRow: '1' }}
              onClick={() => setGalleryOpen(COLLAGE_CARDS[1])}
            >
              <img
                src="/collage_4.webp"
                alt="Tapa eco-friendly"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-green-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">Eco-friendly</span>
                <p className="text-white font-semibold text-sm font-outfit leading-tight">Comprometidos con el planeta</p>
              </div>
            </div>

            {/* 3 – Persona abriendo botella (col 3, fila 2) */}
            <div
              className="relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ gridColumn: '3', gridRow: '2' }}
              onClick={() => setGalleryOpen(COLLAGE_CARDS[2])}
            >
              <img
                src="/collage_3.webp"
                alt="Funcionalidad de tapa"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">Funcionalidad</span>
                <p className="text-white font-semibold text-sm font-outfit leading-tight">Cierres seguros y ergonómicos</p>
              </div>
            </div>

            {/* 4 – Envases PET en cocina (col 1, fila 3) */}
            <div
              className="relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ gridColumn: '1', gridRow: '3' }}
              onClick={() => setGalleryOpen(COLLAGE_CARDS[3])}
            >
              <img
                src="/collage_2.webp"
                alt="Envases PET de colores"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-1">Envases PET</span>
                <p className="text-white font-semibold text-sm font-outfit leading-tight">Cristalinos y certificados</p>
              </div>
            </div>

            {/* 5 – Contenedores cajón (cols 2-3, fila 3) */}
            <div
              className="relative overflow-hidden rounded-2xl group cursor-pointer"
              style={{ gridColumn: '2 / 4', gridRow: '3' }}
              onClick={() => setGalleryOpen(COLLAGE_CARDS[4])}
            >
              <img
                src="/collage_5.webp"
                alt="Contenedores y almacenamiento"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1.5">Contenedores</span>
                <p className="text-white font-bold text-base font-outfit leading-tight">Organización e almacenamiento para cada industria</p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>


      {/* Banda de Certificaciones */}
      <section className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-2">
              <FiShield className="text-blue-400 text-lg flex-shrink-0" />
              <span className="text-sm font-semibold uppercase tracking-widest text-slate-400">Calidad Certificada</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { img: '/iso_blue.webp', hoverImg: '/iso_gold.webp', hasHover: true,  certIdx: 0 },
                { img: '/ema_logo.png', hoverImg: null,            hasHover: false, certIdx: 1 },
                { img: '/iaf_logo.png', hoverImg: null,            hasHover: false, certIdx: 2 },
              ].map((cert, i) => {
                const c = CERT_DATA[cert.certIdx];
                return (
                  <div
                    key={i}
                    onClick={() => setCertOpen(c)}
                    className="group relative flex flex-col items-center gap-3 px-6 py-5 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 hover:border-blue-500/60 transition-all duration-300 cursor-pointer w-44"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <img
                        src={cert.img}
                        alt={c.label}
                        className={`w-full h-full object-contain transition-all duration-500 grayscale opacity-60 ${cert.hasHover ? 'group-hover:opacity-0 group-hover:scale-90' : 'group-hover:grayscale-0 group-hover:opacity-100'}`}
                      />
                      {cert.hasHover && (
                        <img
                          src={cert.hoverImg}
                          alt={c.label + ' gold'}
                          className="absolute inset-0 w-full h-full object-contain opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500"
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm font-outfit leading-none">{c.label}</p>
                      <p className="text-slate-400 text-[11px] mt-1 leading-tight">{c.sub}</p>
                    </div>
                    <p className="text-blue-400 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">Ver detalles →</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Modales ── */}
      <AnimatePresence>
        {galleryOpen && (
          <InfoModal
            key="gallery-modal"
            data={galleryOpen}
            type="gallery"
            onClose={() => setGalleryOpen(null)}
          />
        )}
        {certOpen && (
          <InfoModal
            key="cert-modal"
            data={certOpen}
            type="cert"
            onClose={() => setCertOpen(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
