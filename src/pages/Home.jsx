import React from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import { FiCheckCircle, FiShield, FiPackage, FiSettings, FiDroplet, FiStar } from 'react-icons/fi';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const slides = [
  {
    image: "/corporate_slide_1.png",
    title: "Excelencia en Inyección",
    subtitle: "Maquilamos tapas plásticas y envases PET con tecnología de punta y estándares internacionales para la industria moderna.",
    cta: "Explorar Tecnología"
  },
  {
    image: "/corporate_slide_2.png",
    title: "Pureza Cristalina",
    subtitle: "Nuestro PET de grado farmacéutico y alimenticio garantiza la integridad visual y estructural de su producto en todo momento.",
    cta: "Ver Catálogo"
  },
  {
    image: "/corporate_slide_3.png",
    title: "Precisión Milimétrica",
    subtitle: "Tapas fabricadas con tolerancia cero a fugas. Proteja su contenido con cierres certificados e inviolables.",
    cta: "Solicitar Muestra"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      
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
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black font-outfit text-white mb-4 sm:mb-6 drop-shadow-md tracking-tight leading-tight">
                        {slide.title}
                      </h1>
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

      {/* Nuestras Categorías */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black font-outfit text-slate-800 mb-4 tracking-tight">Nuestras Soluciones</h2>
          <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full mb-6" />
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            Descubra nuestro amplio catálogo diseñado para superar los requerimientos más estrictos del envasado profesional.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {[
            { icon: FiPackage, name: "Envases PET", desc: "Cristalinos y resistentes para múltiples industrias." },
            { icon: FiSettings, name: "Tapas y Cierres", desc: "Flip-tops, disc-tops y seguridad inviolable." },
            { icon: FiDroplet, name: "Dispensadores", desc: "Atomizadores y bombas de alta precisión." },
            { icon: FiStar, name: "Promocionales", desc: "Vasos y artículos personalizables corporativos." }
          ].map((cat, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)] border border-slate-100 transition-all text-center flex flex-col items-center group cursor-pointer"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <cat.icon className="text-4xl" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-xl font-bold font-outfit text-slate-800 mb-1 sm:mb-3">{cat.name}</h3>
              <p className="text-slate-500 text-[11px] sm:text-xs lg:text-sm hidden sm:block">{cat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Certificaciones y Corporativo */}
      <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden bg-white border-t border-slate-100">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm tracking-wide mb-6">
              <FiShield className="text-lg" /> CALIDAD COMPROBADA
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-slate-800 mb-4 sm:mb-6 leading-tight">
              Respaldado por la certificación <span className="text-blue-600">FSCC 22000</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              En Plastitaps estamos comprometidos con la inocuidad. Todos nuestros envases y tapas se fabrican cumpliendo los más altos estándares de calidad y buenas prácticas (BPM), garantizando la seguridad absoluta para el segmento alimenticio, farmacéutico y de belleza.
            </p>
            <ul className="space-y-4 font-medium text-slate-700">
              <li className="flex items-center gap-3"><FiCheckCircle className="text-blue-600 text-xl" /> Trazabilidad total del producto.</li>
              <li className="flex items-center gap-3"><FiCheckCircle className="text-blue-600 text-xl" /> Ambientes limpios y controlados en la fábrica.</li>
              <li className="flex items-center gap-3"><FiCheckCircle className="text-blue-600 text-xl" /> Materiales 100% virgenes y avalados por FDA.</li>
            </ul>
          </div>
          <div className="relative">
            <div className="bg-slate-50 p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200">
              <div className="aspect-square bg-slate-200 rounded-[2rem] overflow-hidden relative">
                <img src="/corporate_slide_1.png" alt="Lab" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-blue-600/10 mix-blend-multiply" />
              </div>
            </div>
            {/* Pequeño badge flotante */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl flex items-center gap-2 sm:gap-4 border border-slate-100"
            >
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                <FiCheckCircle className="text-2xl" />
              </div>
              <div>
                <p className="font-bold text-slate-800 font-outfit">FSCC 22000</p>
                <p className="text-xs text-slate-500 font-medium">Global STD Certification</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
