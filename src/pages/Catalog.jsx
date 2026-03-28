import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiPlusCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import productsData from '../data/products.json';
import { useCart } from '../context/CartContext';

const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtMOQ = (n) => n.toLocaleString('es-MX');

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [quantities, setQuantities] = useState({});
  const [tapasOpen, setTapasOpen] = useState(false);
  
  // Estados para el Modal de Producto
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQty, setModalQty] = useState(0);

  const { addToCart, moqError } = useCart();

  // Estructura jerárquica fija del menú lateral
  const MENU = [
    { id: 'All',                      label: 'Todas las Categorías', type: 'root'   },
    { id: '__tapas__',                label: 'Tapas',                type: 'parent' },
    { id: '__tapas__all',             label: 'Todas las Tapas',     type: 'child'  },
    { id: 'Tapas Diámetro Pequeño',  label: 'Diámetro Pequeño',    type: 'child'  },
    { id: 'Tapas Diámetro Medio',    label: 'Diámetro Medio',      type: 'child'  },
    { id: 'Tapas Diámetro Grande',   label: 'Diámetro Grande',     type: 'child'  },
    { id: 'Tapas Especializadas',    label: 'Especializadas',      type: 'child'  },
    { id: 'Tarros y Envases',        label: 'Tarros y Envases',    type: 'root'   },
    { id: 'Botellas',                label: 'Botellas',            type: 'root'   },
    { id: 'Accesorios',              label: 'Accesorios',          type: 'root'   },
    { id: 'Vasos',                   label: 'Vasos',               type: 'root'   },
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
    cat === 'Tapas Diámetro Medio'   ||
    cat === 'Tapas Diámetro Grande'  ||
    cat === 'Tapas Especializadas';

  // Filtra con soporte de '__tapas__' (todas las tapas de cualquier diámetro)
  const filteredProducts = useMemo(() => {
    return productsData.filter(p => {
      // Si el producto está agotado (stock === 0), lo omitimos del frontend entero (lógica de negocio futura)
      // if (p.stock === 0) return false; 
      
      const matchCat =
        activeCategory === 'All'
          ? true
          : isTapaActive(activeCategory)
            ? p.category.startsWith('Tapas')
              ? (activeCategory === '__tapas__' || activeCategory === '__tapas__all' || p.category === activeCategory)
              : false
            : p.category === activeCategory;
      const matchTag = activeTag === 'All' || p.tags.includes(activeTag);
      return matchCat && matchTag;
    });
  }, [activeCategory, activeTag]);

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

      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="mb-12 text-center md:text-left border-b border-slate-200 pb-10">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black font-outfit mb-4 tracking-tight text-[#0a192f]">
            Catálogo <span className="text-cyan-600">Digital</span>
          </motion.h1>
          <p className="text-slate-600 max-w-2xl text-lg font-medium">
            Precios en MXN + IVA · Todo bajo pedido · Producción mínima garantizada por MOQ.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar filter — sticky con scroll interno independiente */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div
              className="bg-white rounded-3xl p-6 sticky top-32 border border-slate-200 shadow-sm overflow-y-auto overscroll-contain"
              style={{
                maxHeight: 'calc(100vh - 9rem)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent',
              }}
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
                    const isChild  = item.type === 'child';
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
                        <span className={`ml-1.5 text-[10px] font-normal ${
                          isActive ? 'text-white/70' : 'text-slate-400'
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
                  {['All', ...new Set(productsData.flatMap(p => p.tags))].map(tag => {
                    const count = tagCounts[tag] ?? 0;
                    const isActive = activeTag === tag;
                    return (
                      <button key={tag} onClick={() => setActiveTag(tag)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                          isActive
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
                            : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                        }`}>
                        {tag === 'All' ? 'Todos' : tag}
                        <span className={`ml-1 font-normal ${
                          isActive ? 'text-cyan-600' : 'text-slate-400'
                        }`}>({tag === 'All' ? tagCounts['All'] : count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <motion.div key={product.id} layout
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => { setSelectedProduct(product); setModalQty(Math.max(getQty(product), product.moq)); }}
                    className="bg-[#fcfdfd] cursor-pointer rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-xl transition-all flex flex-col overflow-hidden group">

                    {/* Image */}
                    <div className="relative bg-white p-6 flex items-center justify-center border-b border-slate-100">
                      <img src={product.image} alt={product.name}
                        className="h-24 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-[#0a192f] border border-slate-200 shadow-sm">
                        {product.category}
                      </span>
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
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><FiInfo className="text-xs"/> Min. Venta</span>
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
            </motion.div>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="mt-20 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
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

      {/* ── Modal de Producto (Quick View) ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Botón de Cierre */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="Cerrar modal"
              >
                <FiX className="text-xl" />
              </button>

              {/* Lado Izquierdo: Imagen Responsiva */}
              <div className="w-full md:w-1/2 bg-[#f8fafc] p-10 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full max-w-xs object-contain mix-blend-multiply drop-shadow-xl"
                />
              </div>

              {/* Lado Derecho: Datos y Botón Carrito */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                {/* Encabezado */}
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">
                  {selectedProduct.category}
                </span>
                <h2 className="text-3xl font-black font-outfit text-[#0a192f] leading-tight mb-4">
                  {selectedProduct.name}
                </h2>
                
                {/* Descripción Placeholder */}
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Fabricado con resinas de grado industrial y diseñado para una alta compatibilidad con el mercado. Proporciona un sello seguro y cuenta con aplicaciones múltiples que cumplen los estándares de fabricación.
                </p>

                {/* Datos de Venta */}
                <div className="mb-8 space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio Unitario</span>
                    <span className="text-[#0a192f] font-black text-xl">
                      ${fmt(selectedProduct.price)} <span className="text-xs font-normal text-slate-500">MXN xpz + IVA</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                    <span className="text-xs text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1">
                      <FiInfo className="text-sm"/> Min. Venta
                    </span>
                    <span className="text-amber-600 font-black">{fmtMOQ(selectedProduct.moq)} PZ</span>
                  </div>
                </div>

                {/* Controles de Cantidad y Carrito en vivo */}
                <div className="mt-auto">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Cantidad Deseada
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 mb-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={modalQty}
                      onChange={(e) => setModalQty(e.target.value.replace(/\D/g, ''))}
                      onBlur={() => {
                        const numericVal = parseInt(modalQty, 10);
                        if (isNaN(numericVal) || numericVal < selectedProduct.moq) {
                          setModalQty(selectedProduct.moq);
                        }
                      }}
                      className={`w-full sm:w-1/3 bg-white border-2 rounded-xl px-4 py-3 text-lg font-bold text-center focus:outline-none transition-colors ${(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '') ? 'border-red-500 text-red-600 focus:border-red-600' : 'border-slate-200 text-[#0a192f] focus:border-cyan-500'}`}
                    />
                    <div className="w-full sm:w-2/3 flex flex-col justify-center px-5 py-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Estimado</span>
                      <span className="text-2xl font-black font-outfit text-slate-800">
                        {(parseInt(modalQty, 10) >= selectedProduct.moq) 
                          ? `$${(selectedProduct.price * parseInt(modalQty, 10)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                          : '---'} 
                        <span className="text-xs font-normal text-slate-500 ml-1">+ IVA</span>
                      </span>
                    </div>
                  </div>

                  {/* Feedback Visual de Error */}
                  <div className="h-4 w-full mb-4">
                    {(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '') && (
                      <p className="text-red-500 text-xs font-bold text-center w-full">
                        La cantidad debe ser igual o superior al mínimo de {fmtMOQ(selectedProduct.moq)} PZ
                      </p>
                    )}
                  </div>

                  <button
                    disabled={(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '')}
                    onClick={() => {
                      addToCart(selectedProduct, parseInt(modalQty, 10));
                      setSelectedProduct(null);
                    }}
                    className={`w-full py-4 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '') ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a192f] hover:bg-black hover:-translate-y-0.5'}`}
                  >
                    <FiPlusCircle className="text-xl opacity-80" /> Agregar al carrito
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
