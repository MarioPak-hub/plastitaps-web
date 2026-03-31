import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';

export default function PagoExitoso() {
  const { width, height } = useWindowSize();
  const { clearPromoCart } = useCart();

  useEffect(() => {
    // Clear only the promotional items from the cart after successful payment
    clearPromoCart();
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter text-slate-800 flex flex-col">
      <Navbar />
      <Confetti width={width} height={height} numberOfPieces={200} recycle={false} gravity={0.1} />
      
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xl shadow-green-100/50">
            <FiCheckCircle className="text-5xl" />
          </div>
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="space-y-4 max-w-lg"
        >
          <h1 className="text-4xl md:text-6xl font-black font-outfit text-slate-900 tracking-tight">
            ¡Pago <span className="text-green-600">Exitoso!</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Gracias por tu compra. Hemos recibido tu pedido de vasos promocionales y estamos preparando el envío.
          </p>
          <p className="text-slate-400 text-sm italic">
            Recibirás un correo de confirmación con los detalles de tu pedido en unos minutos.
          </p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center"
        >
          <Link to="/perfil" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg">
            Ir a mis pedidos <FiArrowRight />
          </Link>
          <Link to="/" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <FiShoppingBag /> Seguir Comprando
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
