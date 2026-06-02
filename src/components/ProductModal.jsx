import React, { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo, FiPlusCircle, FiBox, FiCheckCircle, FiTarget, FiBriefcase, FiTool, FiDroplet, FiAward } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const ProductModel3D = React.lazy(() => import('./ProductModel3D'));

export default function ProductModal({ selectedProduct, onClose }) {
  const [modalColor, setModalColor] = useState(null);
  const { cart, addToCart } = useCart();

  useEffect(() => {
    if (selectedProduct) {
      setModalColor(selectedProduct.colores?.[0] || null);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const isInQuote = cart.some(i => i.id === selectedProduct.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-5xl relative overflow-hidden flex flex-col md:flex-row max-h-[95vh]"
        >
          {/* Botón de Cierre */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <FiX className="text-lg sm:text-xl" />
          </button>

          {/* Lado Izquierdo: 3D Viewer o Imagen */}
          <div className="w-full md:w-1/2 shrink-0 bg-[#f8fafc] flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 min-h-[300px] sm:min-h-[380px] pb-4 md:pb-0">
            {selectedProduct.modelo3D ? (
              <div className="w-full flex flex-col items-center">
                <Suspense fallback={
                  <div className="w-full flex items-center justify-center" style={{ height: 380 }}>
                    <div className="w-8 h-8 rounded-full border-4 border-t-indigo-600 animate-spin" />
                  </div>
                }>
                  <ProductModel3D
                    modelPath={selectedProduct.modelo3D}
                    selectedColor={modalColor || '#cccccc'}
                  />
                </Suspense>
                {/* Color Swatches */}
                {(selectedProduct.colores && selectedProduct.colores.length > 0) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Color:</span>
                    {selectedProduct.colores.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setModalColor(hex)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 ${modalColor === hex
                          ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110'
                          : 'border-slate-300'
                          }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 sm:p-10 flex items-center justify-center">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full max-w-xs object-contain mix-blend-multiply drop-shadow-xl"
                />
              </div>
            )}
          </div>

          {/* Lado Derecho: Datos y Botón Carrito */}
          <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-10 lg:p-12 flex flex-col overflow-y-auto">
            {/* Encabezado */}
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">
              {selectedProduct.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-outfit text-[#0a192f] leading-tight mb-3 sm:mb-4">
              {selectedProduct.name}
            </h2>

            {/* Descripción Completa Premium */}
            {selectedProduct.fullDescription ? (
              <div className="mb-6 sm:mb-8 space-y-5">
                <p className="text-slate-500 text-sm leading-relaxed text-justify">
                  {selectedProduct.fullDescription.about}
                </p>
                
                <div className="grid grid-cols-1 gap-4 mt-4 border-t border-slate-100 pt-4">
                  {/* Usos recomendados */}
                  {selectedProduct.fullDescription.uses && selectedProduct.fullDescription.uses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <FiTarget className="text-cyan-600" /> Usos Recomendados
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedProduct.fullDescription.uses.map((use, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-500">
                            <FiCheckCircle className="text-cyan-500 shrink-0 mt-0.5 text-[10px]" /> {use}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ventajas */}
                  {selectedProduct.fullDescription.advantages && selectedProduct.fullDescription.advantages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <FiAward className="text-cyan-600" /> Ventajas Clave
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.fullDescription.advantages.map((adv, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">
                            {adv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aplicaciones */}
                  {selectedProduct.fullDescription.applications && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <FiBriefcase className="text-cyan-600" /> Aplicaciones
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {selectedProduct.fullDescription.applications}
                      </p>
                    </div>
                  )}

                  {/* Personalización y Material (en 2 columnas si es desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProduct.fullDescription.customization && (
                      <div className="bg-cyan-50/50 p-3 rounded-xl border border-cyan-100/50">
                        <h4 className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <FiTool /> Personalización
                        </h4>
                        <p className="text-xs text-slate-600">
                          {selectedProduct.fullDescription.customization}
                        </p>
                      </div>
                    )}
                    {selectedProduct.fullDescription.material && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <FiDroplet className="text-slate-400" /> Material / Resistencia
                        </h4>
                        <p className="text-xs text-slate-600">
                          {selectedProduct.fullDescription.material}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-5 sm:mb-6 leading-relaxed">
                {selectedProduct.description || 'Fabricado con resinas de grado industrial y diseñado para una alta compatibilidad con el mercado. Proporciona un sello seguro y cuenta con aplicaciones múltiples que cumplen los estándares de fabricación.'}
              </p>
            )}

            {/* CTA Cotización */}
            <div className="mt-auto">
              <div className="mb-4 sm:mb-5 flex gap-2.5 items-start bg-blue-50 border border-blue-100 rounded-2xl p-3 sm:p-4">
                <FiInfo className="text-blue-600 text-base shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Las cantidades, personalización y especificaciones se definen con un asesor de
                  Plastitaps para ayudarte de la mejor manera.
                </p>
              </div>

              <button
                disabled={isInQuote}
                onClick={() => {
                  addToCart(selectedProduct);
                  onClose();
                }}
                className={`w-full py-3.5 sm:py-4 text-white rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${isInQuote ? 'bg-green-600 cursor-default' : 'bg-[#0a192f] hover:bg-black hover:-translate-y-0.5'}`}
              >
                {isInQuote
                  ? <><FiCheckCircle className="text-xl opacity-90" /> En tu cotización</>
                  : <><FiPlusCircle className="text-xl opacity-80" /> Agregar a mi cotización</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
