import React from 'react';
import { motion } from 'framer-motion';
import { FiPlusCircle, FiCheckCircle, FiShoppingBag, FiEye, FiInfo } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import retailProducts from '../data/retail_products.json';
import { useCart } from '../context/CartContext';

// ── Página Promocionales — flujo de cotización (sin precios ni pago) ───────────
export default function Promocionales({ openProductBySlug }) {
  const { cart, addToCart } = useCart();

  const isInQuote = (id) => cart.some(i => i.id === id);

  return (
    <div className="min-h-screen bg-white font-inter text-slate-800">
      <Seo
        title="Vasos Promocionales Personalizados"
        description="Vasos promocionales plásticos personalizados con tu logo y color. Productos plásticos para empresas fabricados por Plastitaps, proveedor de envases y empaques plásticos."
        path="/promocionales"
      />
      <Navbar />

      <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-5">
            <FiShoppingBag /> Vasos Promocionales · Cotización
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900 mb-3">
            Vasos <span className="text-blue-600">Promocionales</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Selecciona los modelos que te interesan y solicita tu cotización. Un asesor de
            Plastitaps te contactará para definir cantidades, personalización y detalles.
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {retailProducts.map(p => {
            const selected = isInQuote(p.id);

            return (
              <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div
                  className={`rounded-3xl border-2 overflow-hidden transition-all ${selected
                    ? 'border-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md shadow-sm'
                    }`}>

                  {/* Image */}
                  <div className="bg-slate-50 flex items-center justify-center p-6 h-44 relative">
                    <span className="absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">{p.badge}</span>
                    <img src={p.image} alt={p.name} className="h-32 object-contain" style={{ filter: p.filter }} />
                    {selected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full border-2 bg-blue-600 border-blue-600 flex items-center justify-center">
                        <FiCheckCircle className="text-white text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 bg-white">
                    <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">{p.description}</p>

                    <div className="flex flex-col gap-2">
                      {/* Ver detalles button — opens global modal */}
                      {openProductBySlug && p.slug && (
                        <button
                          onClick={() => openProductBySlug(p.slug)}
                          className="w-full py-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FiEye className="text-sm" /> Ver detalles
                        </button>
                      )}

                      {/* Agregar a cotización */}
                      <button
                        onClick={() => addToCart(p)}
                        disabled={selected}
                        className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-md ${selected
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5'
                          }`}
                      >
                        {selected
                          ? <><FiCheckCircle /> En tu cotización</>
                          : <><FiPlusCircle /> Agregar a mi cotización</>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Nota de asesoría */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3 items-start">
          <FiInfo className="text-blue-600 text-lg shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Las cantidades, opciones de personalización y especificaciones se definen junto con
            el personal de Plastitaps para asesorarte de la mejor manera. Agrega los productos de
            tu interés y solicita tu cotización desde el carrito.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
