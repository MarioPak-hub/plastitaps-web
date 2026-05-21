import React, { useState, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo, FiPlusCircle, FiBox, FiCheckCircle, FiTarget, FiBriefcase, FiTool, FiDroplet, FiAward } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const ProductModel3D = React.lazy(() => import('./ProductModel3D'));

const fmt = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtMOQ = (n) => n.toLocaleString('es-MX');

export default function ProductModal({ selectedProduct, onClose }) {
  const [modalQty, setModalQty] = useState('');
  const [modalColor, setModalColor] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (selectedProduct) {
      setModalQty(selectedProduct.moq);
      setModalColor(selectedProduct.colores?.[0] || null);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

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

            {/* Datos de Venta */}
            <div className="mb-6 sm:mb-8 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio Unitario</span>
                <span className="text-[#0a192f] font-black text-lg sm:text-xl">
                  ${fmt(selectedProduct.price)} <span className="text-xs font-normal text-slate-500">MXN x {selectedProduct.unit} + IVA</span>
                </span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-3 sm:p-4 rounded-2xl border border-amber-100/50">
                <span className="text-xs text-amber-700 font-bold uppercase tracking-wider flex items-center gap-1">
                  <FiInfo className="text-sm" /> Min. Venta
                </span>
                <span className="text-amber-600 font-black">{fmtMOQ(selectedProduct.moq)} {selectedProduct.unit?.toUpperCase()}</span>
              </div>
            </div>

            {/* Controles de Cantidad y Carrito en vivo */}
            <div className="mt-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Cantidad Deseada
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-2">
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
                <div className="w-full sm:w-2/3 flex flex-col justify-center px-4 sm:px-5 py-2 bg-slate-50 rounded-xl border-2 border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Estimado</span>
                  <span className="text-xl sm:text-2xl font-black font-outfit text-slate-800">
                    {(parseInt(modalQty, 10) >= selectedProduct.moq)
                      ? `$${(selectedProduct.price * parseInt(modalQty, 10)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                      : '---'}
                    <span className="text-xs font-normal text-slate-500 ml-1">+ IVA</span>
                  </span>
                </div>
              </div>

              {/* Feedback Visual de Error */}
              <div className="h-4 w-full mb-3 sm:mb-4">
                {(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '') && (
                  <p className="text-red-500 text-xs font-bold text-center w-full">
                    La cantidad debe ser igual o superior al mínimo de {fmtMOQ(selectedProduct.moq)} {selectedProduct.unit?.toUpperCase()}
                  </p>
                )}
              </div>

              <button
                disabled={(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '')}
                onClick={() => {
                  addToCart(selectedProduct, parseInt(modalQty, 10));
                  onClose();
                }}
                className={`w-full py-3.5 sm:py-4 text-white rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${(parseInt(modalQty, 10) < selectedProduct.moq || modalQty === '') ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0a192f] hover:bg-black hover:-translate-y-0.5'}`}
              >
                <FiPlusCircle className="text-xl opacity-80" /> Agregar al carrito
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
