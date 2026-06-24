import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800 flex flex-col">
      <Seo
        title="Página no encontrada"
        description="La página que buscas no existe. Explora nuestro catálogo de tapas plásticas, envases PET y soluciones de empaque."
        path="/404"
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="text-center max-w-lg">
          <p className="text-blue-600 font-black font-outfit text-7xl mb-4">404</p>
          <h1 className="text-2xl sm:text-3xl font-black font-outfit text-slate-900 mb-3">
            Esta página no existe
          </h1>
          <p className="text-slate-500 mb-8">
            Puede que el enlace esté roto o la página se haya movido. Prueba con alguna de estas opciones:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full transition-all"
            >
              Ver Catálogo Técnico <FiArrowRight />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-bold text-sm rounded-full transition-all"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
