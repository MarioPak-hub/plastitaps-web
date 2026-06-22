import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiPlusCircle, FiInfo, FiCheckCircle, FiX, FiBox, FiChevronDown, FiSearch } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import productsData from '../data/products.json';
import { useCart } from '../context/CartContext';

const ProductModel3D = React.lazy(() => import('../components/ProductModel3D'));

// Slugs amigables para enlazar desde fuera (Home, sitemap) → id interno de categoría
const CATEGORY_SLUGS = {
  tapas: '__tapas__all',
  botellas: 'Botellas',
  tarros: 'Tarros y Envases',
  vasos: 'Vasos',
  accesorios: 'Accesorios',
};

export default function Catalog({ openProductBySlug }) {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [tapasOpen, setTapasOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // El modal se maneja globalmente en App.jsx

  const { cart, addToCart } = useCart();
  const isInQuote = (id) => cart.some(i => i.id === id);

  // Lee ?categoria=tapas|botellas|tarros|vasos|accesorios para enlaces externos (Home, sitemap)
  useEffect(() => {
    const slug = searchParams.get('categoria');
    const mapped = slug && CATEGORY_SLUGS[slug];
    if (mapped) {
      setActiveCategory(mapped);
      if (mapped.startsWith('__tapas__')) setTapasOpen(true);
    }
  }, [searchParams]);

  // Estructura jerárquica fija del menú lateral
  const MENU = [
    { id: 'All', label: 'Todas las Categorías', type: 'root' },
    { id: '__tapas__', label: 'Tapas', type: 'parent' },
    { id: '__tapas__all', label: 'Todas las Tapas', type: 'child' },
    { id: 'Tapas Diámetro Pequeño', label: 'Diámetro Pequeño', type: 'child' },
    { id: 'Tapas Diámetro Medio', label: 'Diámetro Medio', type: 'child' },
    { id: 'Tapas Diámetro Grande', label: 'Diámetro Grande', type: 'child' },
    { id: 'Tapas Especializadas', label: 'Especializadas', type: 'child' },
    { id: 'Tarros y Envases', label: 'Tarros y Envases', type: 'root' },
    { id: 'Botellas', label: 'Botellas', type: 'root' },
    { id: 'Accesorios', label: 'Accesorios', type: 'root' },
    { id: 'Vasos', label: 'Vasos', type: 'root' },
  ];

  // Al seleccionar Tapas padre → abre/cierra acordeón pero TAMBIÉN selecciona "Todas las Tapas" por defecto
  const handleMenuClick = (item) => {
    if (item.type === 'parent') {
      setTapasOpen(o => !o);
      setActiveCategory('__tapas__all');
    } else {
      setActiveCategory(item.id);
      if (item.type === 'child') setTapasOpen(true);
    }
  };

  const isTapaActive = (cat) =>
    cat === '__tapas__' ||
    cat === '__tapas__all' ||
    cat === 'Tapas Diámetro Pequeño' ||
    cat === 'Tapas Diámetro Medio' ||
    cat === 'Tapas Diámetro Grande' ||
    cat === 'Tapas Especializadas';

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return productsData.filter(p => {
      // Search filter
      if (query && !p.name.toLowerCase().includes(query)) return false;

      const matchCat =
        activeCategory === 'All'
          ? true
          : isTapaActive(activeCategory)
            ? p.category.startsWith('Tapas')
              ? (activeCategory === '__tapas__' || activeCategory === '__tapas__all' || p.category === activeCategory)
              : false
            : p.category === activeCategory;
      const matchTag =
        activeTag === 'All'
          ? true
          : activeTag === '3D'
            ? !!p.modelo3D
            : p.tags.includes(activeTag);
      return matchCat && matchTag;
    });
  }, [activeCategory, activeTag, searchQuery]);

  // Contadores por categoría (totales estáticos del dataset descontando agotados si se configuraran)
  const catCounts = useMemo(() => {
    const counts = { All: productsData.length };
    const tapasTotal = productsData.filter(p => p.category.startsWith('Tapas')).length;
    counts['__tapas__'] = tapasTotal;
    counts['__tapas__all'] = tapasTotal; // Mismo número exacto
    productsData.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Contadores de tags dinámicos: se recalculan según la categoría activa
  const tagCounts = useMemo(() => {
    const subset = productsData.filter(p => {
      if (activeCategory === 'All') return true;
      if (isTapaActive(activeCategory))
        return p.category.startsWith('Tapas') &&
          (activeCategory === '__tapas__' || activeCategory === '__tapas__all' || p.category === activeCategory);
      return p.category === activeCategory;
    });
    const counts = { All: subset.length };
    // Count products with 3D models
    const model3DCount = subset.filter(p => !!p.modelo3D).length;
    if (model3DCount > 0) counts['3D'] = model3DCount;
    subset.forEach(p => p.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [activeCategory]);

  const handleAdd = (product, e) => {
    e.stopPropagation(); // Evita abrir el modal al añadir desde la tarjeta
    addToCart(product);
  };

  const categoryLabel = MENU.find(m => m.id === activeCategory)?.label || 'Todas las Categorías';
  const seoTitle = activeCategory === 'All'
    ? 'Catálogo de Tapas Plásticas y Envases PET'
    : `${categoryLabel} | Catálogo`;
  const seoDescription = activeCategory === 'All'
    ? 'Catálogo completo de tapas plásticas, envases PET, botellas, tarros y soluciones de empaque. Fabricación bajo pedido para empresas, con cotización directa.'
    : `Conoce nuestra línea de ${categoryLabel.toLowerCase()} fabricadas bajo pedido. Cotiza directamente con Plastitaps, proveedor de envases y empaques plásticos.`;

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path="/catalogo"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: seoTitle,
          description: seoDescription,
          url: 'https://plastitaps.com/catalogo',
          isPartOf: { '@type': 'WebSite', name: 'Plastitaps', url: 'https://plastitaps.com/' },
        }}
      />
      <Navbar />

      <div className="pt-24 sm:pt-32 pb-8 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 text-center md:text-left border-b border-slate-200 pb-6 sm:pb-10">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit mb-3 sm:mb-4 tracking-tight text-[#0a192f]">
            Catálogo de <span className="text-cyan-600">Tapas Plásticas y Envases PET</span>
          </motion.h1>
          <p className="text-slate-600 max-w-2xl text-sm sm:text-base lg:text-lg font-medium">
            Tapas para envases, botellas PET y envases plásticos bajo pedido · Agrega los productos de tu interés y solicita tu cotización.
          </p>

          {/* Search bar */}
          <div className="mt-4 sm:mt-6 max-w-xl relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-sm transition-all"
              id="catalog-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-10">

          {/* ── Mobile: Floating filter toggle button ── */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileFiltersOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <FiFilter className="text-cyan-600 text-lg" />
                <span className="font-bold text-[#0a192f] text-sm">Filtros</span>
                {(activeCategory !== 'All' || activeTag !== 'All') && (
                  <span className="bg-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {(activeCategory !== 'All' ? 1 : 0) + (activeTag !== 'All' ? 1 : 0)}
                  </span>
                )}
              </div>
              <motion.span
                animate={{ rotate: mobileFiltersOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <FiChevronDown className="text-slate-400 text-lg" />
              </motion.span>
            </button>

            {/* Mobile filter panel overlay */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setMobileFiltersOpen(false)}
                  />

                  {/* Slide-up panel */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 20, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="relative z-50 mt-3 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                  >
                    <div className="p-5 max-h-[60vh] overflow-y-auto overscroll-contain filter-scroll">
                      {/* Header with close button */}
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[#0a192f] font-bold text-lg font-outfit flex items-center gap-2">
                          <FiFilter className="text-cyan-600" /> Filtros
                        </h3>
                        <button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                          <FiX className="text-slate-500 text-sm" />
                        </button>
                      </div>

                      {/* Tipo de Producto */}
                      <div className="mb-6">
                        <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-3">Tipo de Producto</h3>
                        <div className="flex flex-col gap-1.5">
                          {MENU.map(item => {
                            if (item.type === 'child' && !tapasOpen) return null;
                            const isActive = activeCategory === item.id;
                            const isChild = item.type === 'child';
                            const isParent = item.type === 'parent';
                            return (
                              <motion.button
                                key={item.id}
                                layout
                                onClick={() => { handleMenuClick(item); }}
                                className={`
                                  text-left rounded-xl transition-all font-bold text-sm flex items-center justify-between
                                  ${isChild ? 'ml-4 pl-3 pr-3 py-2' : 'px-4 py-2.5'}
                                  ${isActive
                                    ? 'bg-[#0a192f] text-white shadow-md'
                                    : isChild
                                      ? 'text-slate-500 hover:bg-slate-100 hover:text-[#0a192f]'
                                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0a192f] hover:shadow-sm'
                                  }
                                `}
                              >
                                <span className={isChild ? 'text-xs' : ''}>{item.label}</span>
                                <span className={`ml-1.5 text-[10px] font-normal ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                  ({catCounts[item.id] ?? 0})
                                </span>
                                {isParent && (
                                  <span className={`text-xs ml-auto transition-transform duration-200 ${tapasOpen ? 'rotate-90' : ''}`}>
                                    ›
                                  </span>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filtros Adicionales (Tags) */}
                      <div className="mb-4">
                        <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-3">Filtros Adicionales</h3>
                        <div className="flex flex-wrap gap-2">
                          {['All', ...(tagCounts['3D'] ? ['3D'] : []), ...new Set(productsData.flatMap(p => p.tags))].map(tag => {
                            const count = tagCounts[tag] ?? 0;
                            const isActive = activeTag === tag;
                            return (
                              <button key={tag} onClick={() => { setActiveTag(tag); }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isActive
                                  ? tag === '3D' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-cyan-600 bg-cyan-50 text-cyan-800'
                                  : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                                  }`}>
                                {tag === 'All' ? 'Todos' : tag === '3D' ? <><FiBox className="inline mr-1 text-[10px]" />3D</> : tag}
                                <span className={`ml-1 font-normal ${isActive ? (tag === '3D' ? 'text-indigo-600' : 'text-cyan-600') : 'text-slate-400'}`}>({tag === 'All' ? tagCounts['All'] : count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Apply / Clear actions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => { setActiveCategory('All'); setActiveTag('All'); }}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={() => setMobileFiltersOpen(false)}
                          className="flex-1 py-2.5 rounded-xl bg-[#0a192f] text-white text-xs font-bold hover:bg-black transition-colors"
                        >
                          Ver {filteredProducts.length} productos
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ── Desktop: Sidebar filter — sticky con scroll interno independiente ── */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div
              className="bg-white rounded-3xl sticky top-32 border border-slate-200 shadow-sm overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 9rem)' }}
            >
              <div
                className="p-6 overflow-y-auto overscroll-contain filter-scroll"
                style={{ maxHeight: 'calc(100vh - 9rem)' }}
              >
                <div className="flex items-center gap-2 text-[#0a192f] font-bold text-xl mb-6 font-outfit">
                  <FiFilter className="text-cyan-600" /> Filtros
                </div>
                {/* ── Menú Tipo de Producto (Acordeón) ── */}
                <div className="mb-8">
                  <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-4">Tipo de Producto</h3>
                  <div className="flex flex-col gap-1.5">
                    {MENU.map(item => {
                      if (item.type === 'child' && !tapasOpen) return null;

                      const isActive = activeCategory === item.id;
                      const isChild = item.type === 'child';
                      const isParent = item.type === 'parent';

                      return (
                        <motion.button
                          key={item.id}
                          layout
                          onClick={() => handleMenuClick(item)}
                          className={`
                          text-left rounded-xl transition-all font-bold text-sm flex items-center justify-between
                          ${isChild ? 'ml-4 pl-3 pr-3 py-2' : 'px-4 py-2.5'}
                          ${isActive
                              ? 'bg-[#0a192f] text-white shadow-md'
                              : isChild
                                ? 'text-slate-500 hover:bg-slate-100 hover:text-[#0a192f]'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#0a192f] hover:shadow-sm'
                            }
                        `}
                        >
                          <span className={isChild ? 'text-xs' : ''}>{item.label}</span>
                          <span className={`ml-1.5 text-[10px] font-normal ${isActive ? 'text-white/70' : 'text-slate-400'
                            }`}>
                            ({catCounts[item.id] ?? 0})
                          </span>
                          {isParent && (
                            <span className={`text-xs ml-auto transition-transform duration-200 ${tapasOpen ? 'rotate-90' : ''}`}>
                              ›
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Filtros Adicionales (Tags) con contadores dinámicos ── */}
                <div>
                  <h3 className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-4">Filtros Adicionales</h3>
                  <div className="flex flex-wrap gap-2">
                    {['All', ...(tagCounts['3D'] ? ['3D'] : []), ...new Set(productsData.flatMap(p => p.tags))].map(tag => {
                      const count = tagCounts[tag] ?? 0;
                      const isActive = activeTag === tag;
                      return (
                        <button key={tag} onClick={() => setActiveTag(tag)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${isActive
                            ? tag === '3D' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-cyan-600 bg-cyan-50 text-cyan-800'
                            : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                            }`}>
                          {tag === 'All' ? 'Todos' : tag === '3D' ? <><FiBox className="inline mr-1 text-[10px]" />3D</> : tag}
                          <span className={`ml-1 font-normal ${isActive ? (tag === '3D' ? 'text-indigo-600' : 'text-cyan-600') : 'text-slate-400'
                            }`}>({tag === 'All' ? tagCounts['All'] : count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map(product => (
                  <motion.div key={product.id} layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2, layout: { duration: 0.25, type: 'spring', stiffness: 300, damping: 30 } }}
                    onClick={() => openProductBySlug(product.slug || String(product.id))}
                    className="bg-[#fcfdfd] cursor-pointer rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-xl transition-all flex flex-col overflow-hidden group">

                    {/* Image */}
                    <div className="relative bg-white p-6 flex items-center justify-center border-b border-slate-100">
                      {!product.image && product.modelo3D ? (
                        <div className="h-24 w-full">
                          <Suspense fallback={<div className="h-24" />}>
                            <ProductModel3D modelPath={product.modelo3D} height="100%" disableControls />
                          </Suspense>
                        </div>
                      ) : (
                        <img src={product.image} alt={product.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/logo_plastitaps.png'; }}
                          className="h-24 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                      )}
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-[#0a192f] border border-slate-200 shadow-sm">
                        {product.category}
                      </span>
                      {product.modelo3D && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm flex items-center gap-0.5">
                          <FiBox className="text-[9px]" /> 3D
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-[#0a192f] mb-1 text-lg leading-tight group-hover:text-cyan-700 transition-colors">{product.name}</h3>
                      {product.shortDescription && (
                        <p className="text-slate-400 text-[11px] italic mb-4 line-clamp-1">{product.shortDescription}</p>
                      )}


                      {/* CTA Cotizar */}
                      <div className="flex flex-col mt-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleAdd(product, e)}
                          disabled={isInQuote(product.id)}
                          className={`w-full py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-md ${isInQuote(product.id) ? 'bg-green-600 cursor-default' : 'bg-[#0a192f] hover:bg-black'}`}>
                          {isInQuote(product.id)
                            ? <><FiCheckCircle /> En tu cotización</>
                            : <><FiPlusCircle /> Cotizar</>}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium leading-tight">
                          Cantidades y especificaciones se definen con un asesor de Plastitaps.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="mt-12 sm:mt-20 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200">
          <h3 className="font-outfit font-black text-xl mb-4 text-[#0a192f] flex items-center gap-2">
            <FiInfo className="text-cyan-600" /> Términos y Condiciones
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-600">
            <li className="flex gap-2 items-start"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> No se manejan inventarios, todo es sobre pedido.</li>
            <li className="flex gap-2 items-start"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Se requiere 50% de anticipo para iniciar producción.</li>
            <li className="flex gap-2 items-start"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Producción mínima sujeta a especificaciones de cada producto.</li>
            <li className="flex gap-2 items-start md:col-span-2 lg:col-span-1"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Un asesor de Plastitaps te contactará para afinar tu cotización.</li>
          </ul>
        </div>
      </div>

      {/* Modal is now managed globally in App.jsx */}

      <Footer />
    </div>
  );
}
