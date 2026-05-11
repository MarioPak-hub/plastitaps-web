import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-600 py-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-1 sm:col-span-2">
          <h2 className="font-outfit font-black text-3xl text-slate-800 mb-4 tracking-tight">
            Plasti<span className="text-blue-600">taps</span>
          </h2>
          <p className="font-inter text-sm mb-6 max-w-sm leading-relaxed text-slate-500">
            Empresa mexicana fabricante de envases PET y tapas plásticas con calidad internacional. Especializados en los segmentos alimenticio, cosmético y farmacéutico con certificación FSCC 22000.
          </p>
          <div className="text-xs text-slate-400">
            © 2026 Plastitaps Corporate Premium. Todos los derechos reservados.
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Navegación</h3>
          <ul className="space-y-3 text-sm font-medium">
            <li><Link to="/" className="hover:text-blue-600 transition-colors">Inicio</Link></li>
            <li><Link to="/catalogo" className="hover:text-blue-600 transition-colors">Catálogo Técnico</Link></li>
            <li><Link to="/disena-tu-vaso" className="hover:text-blue-600 transition-colors">Personalizar Vaso</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Ejecutivo Comercial</h3>
          {/* Email con funcionalidad mailto */}
          <p className="text-sm mb-2">
            <span className="font-semibold">Email: </span>
            <a href="mailto:ventas@plastitaps.com" className="hover:text-blue-600 transition-colors">
              ventas@plastitaps.com
            </a>
          </p>
          {/* Teléfono con funcionalidad tel */}
          <p className="text-sm mb-4">
            <span className="font-semibold">Tel: </span>
            <a href="tel:+523335750197" className="hover:text-blue-600 transition-colors">
              +52 (33) 3575 0197
            </a>
          </p>
          {/* Botón "Solicitar ayuda" redirige a Contacto */}
          <Link to="/contacto">
            <button className="px-6 py-2 border-2 border-slate-300 hover:border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full text-sm font-bold transition-all">
              Solicitar ayuda
            </button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
