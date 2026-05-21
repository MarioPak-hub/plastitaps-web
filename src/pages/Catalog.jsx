import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiPlusCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiX, FiBox, FiChevronDown, FiSearch } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import productsData from '../data/products.json';
import { useCart } from '../context/CartContext';

const ProductModel3D = React.lazy(() => import('../components/ProductModel3D'));

const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtMOQ = (n) => n.toLocaleString('es-MX');

export default function Catalog({ openProductBySlug }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [quantities, setQuantities] = useState({});
  const [tapasOpen, setTapasOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // El modal se maneja globalmente en App.jsx

  const { addToCart, moqError } = useCart();

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

  // Manejo de Estado de Cantidad por Tarjeta
  const getQty = (product) => quantities[product.id] ?? product.moq;

  const handleQtyChange = (product, val) => {
    // Permite cualquier texto mientras se escribe pero extrae dígitos
    const numericStr = val.toString().replace(/\D/g, '');
    setQuantities(prev => ({ ...prev, [product.id]: numericStr }));
  };

  const handleQtyBlur = (product) => {
    setQuantities(prev => {
      const current = prev[product.id];
      const numericVal = parseInt(current, 10);
      // Restricción inferior estricta solo en onBlur
      if (isNaN(numericVal) || numericVal < product.moq) {
        return { ...prev, [product.id]: product.moq };
      }
      return { ...prev, [product.id]: numericVal };
    });
  };

  const handleAdd = (product, e) => {
    e.stopPropagation(); // Evita abrir el modal al añadir desde la tarjeta
    const qtyStr = getQty(product);
    const numericVal = parseInt(qtyStr, 10);
    if (!isNaN(numericVal) && numericVal >= product.moq) {
      addToCart(product, numericVal);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />

      {/* MOQ error toast */}
      <AnimatePresence>
        {moqError && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm"
          >
            <FiAlertTriangle className="text-xl" />
            Mínimo de Orden: {fmtMOQ(moqError.moq)} {moqError.unit} para {moqError.name}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 sm:pt-32 pb-8 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12 text-center md:text-left border-b border-slate-200 pb-6 sm:pb-10">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit mb-3 sm:mb-4 tracking-tight text-[#0a192f]">
            Catálogo <span className="text-cyan-600">Digital</span>
          </motion.h1>
          <p className="text-slate-600 max-w-2xl text-sm sm:text-base lg:text-lg font-medium">
            Precios en MXN + IVA · Todo bajo pedido · Producción mínima garantizada por MOQ.
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
                    onClick={() => openProductBySlug(product.slug || String(product.id), Math.max(getQty(product), product.moq))}
                    className="bg-[#fcfdfd] cursor-pointer rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-xl transition-all flex flex-col overflow-hidden group">

                    {/* Image */}
                    <div className="relative bg-white p-6 flex items-center justify-center border-b border-slate-100">
                      <img src={product.image} alt={product.name}
                        className="h-24 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
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
                      <p className="text-slate-500 text-xs mb-4 line-clamp-2">{product.description}</p>

                      {/* Pricing */}
                      <div className="bg-white rounded-xl p-3 mb-2 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio</span>
                          <span className="text-[#eba014] font-black font-outfit text-lg">${fmt(product.price)} x{product.unit}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><FiInfo className="text-xs" /> Min. Venta</span>
                          <span className="text-[#eba014] font-bold text-sm bg-[#eba014]/10 px-2 py-0.5 rounded-md">{fmtMOQ(product.moq)} {product.unit.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold">Total estimado aprox.</span>
                          <span className="text-slate-700 font-bold text-sm">
                            {parseInt(getQty(product), 10) >= product.moq
                              ? `$${(product.price * parseInt(getQty(product), 10)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                              : '---'}
                          </span>
                        </div>
                      </div>

                      {/* Qty input + CTA */}
                      <div className="flex flex-col mt-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input type="text" inputMode="numeric"
                            value={getQty(product)}
                            onChange={e => handleQtyChange(product, e.target.value)}
                            onBlur={() => handleQtyBlur(product)}
                            className={`w-24 bg-white border rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none transition-colors ${parseInt(getQty(product), 10) < product.moq || getQty(product) === '' ? 'border-red-500 text-red-600 focus:border-red-600' : 'border-slate-200 text-slate-700 focus:border-cyan-500'}`} />
                          <button onClick={(e) => handleAdd(product, e)}
                            disabled={parseInt(getQty(product), 10) < product.moq || getQty(product) === ''}
                            className={`flex-1 py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-md ${parseInt(getQty(product), 10) < product.moq || getQty(product) === '' ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a192f] hover:bg-black'}`}>
                            <FiPlusCircle /> Cotizar
                          </button>
                        </div>
                        {(parseInt(getQty(product), 10) < product.moq || getQty(product) === '') && (
                          <p className="text-red-500 text-[10px] font-bold mt-2 text-center leading-tight">
                            La cantidad debe ser igual o superior al mínimo de {fmtMOQ(product.moq)} PZ
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2 text-center font-semibold uppercase tracking-wider">+ IVA</p>
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
            <li className="flex gap-2 items-start"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Precios sujetos a cambio sin previo aviso.</li>
            <li className="flex gap-2 items-start"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Los precios NO incluyen IVA (+16%).</li>
            <li className="flex gap-2 items-start md:col-span-2 lg:col-span-1"><FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5" /> Moneda de cotización: Pesos Mexicanos (MXN).</li>
          </ul>
        </div>
      </div>

      {/* Modal is now managed globally in App.jsx */}

      <Footer />
    </div>
  );
}
