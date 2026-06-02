import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Link that scrolls to top on navigation
function ScrollLink({ to, children, className }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-600 py-16 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-1 sm:col-span-2">
          <img src="/logo_plastitaps.png" alt="Plastitaps" className="h-10 w-auto object-contain mb-4" />
          <p className="font-inter text-sm mb-6 max-w-sm leading-relaxed text-slate-500">
            Empresa mexicana fabricante de envases PET y tapas plásticas con calidad internacional. Especializados en los segmentos alimenticio, cosmético y farmacéutico con certificación ISO 9001-2015.
          </p>
          <div className="text-xs text-slate-400">
            © 2026 Plastitaps Corporate Premium. Todos los derechos reservados.
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-wider text-sm">Navegación</h3>
          <ul className="space-y-3 text-sm font-medium">
            <li><ScrollLink to="/" className="hover:text-blue-600 transition-colors">Inicio</ScrollLink></li>
            <li><ScrollLink to="/catalogo" className="hover:text-blue-600 transition-colors">Catálogo Técnico</ScrollLink></li>
            <li><ScrollLink to="/disena-tu-vaso" className="hover:text-blue-600 transition-colors">Personalizar Vaso</ScrollLink></li>
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
            <a href="tel:+5233259625" className="hover:text-blue-600 transition-colors">
              +52 33259625
            </a>
          </p>
          {/* Botón "Solicitar ayuda" redirige a Contacto con scroll */}
          <ScrollLink to="/contacto">
            <button className="px-6 py-2 border-2 border-slate-300 hover:border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full text-sm font-bold transition-all">
              Solicitar ayuda
            </button>
          </ScrollLink>
        </div>
      </div>
    </footer>
  );
}
