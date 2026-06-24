import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { cart, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  
  const cartCount = cart?.length || 0;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Prevenir scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/',               label: 'Inicio',            end: true  },
    { to: '/catalogo',       label: 'Catálogo Técnico',  end: false },
    { to: '/disena-tu-vaso', label: 'Personalizar Vaso', end: false },
    { to: '/',               label: 'Nosotros',          end: false, hash: 'nosotros' },
    { to: '/contacto',       label: 'Contacto',          end: false },
  ];

  // Navbar fija — al hacer scroll a una sección hay que restar su altura
  // para no dejar el título tapado debajo de ella.
  const NAVBAR_OFFSET = 88;

  const scrollToHash = (hash) => {
    const el = document.getElementById(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  /**
   * Al hacer clic en un enlace de navegación:
   * - Si tiene hash y ya estamos en esa ruta → scroll suave a la sección
   * - Si tiene hash y estamos en otra ruta → navegar y luego scroll a la sección
   * - Si no tiene hash y ya estamos en esa ruta → scroll suave al top
   * - Si no tiene hash y estamos en otra ruta → navegar y luego scroll al top
   */
  const handleNavClick = (to, e, hash) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (hash) {
      if (location.pathname === to) {
        scrollToHash(hash);
      } else {
        navigate(to);
        setTimeout(() => scrollToHash(hash), 150);
      }
      return;
    }

    if (location.pathname === to) {
      // Ya estamos en esa página, hacer scroll al top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navegar a la nueva ruta
      navigate(to);
      // Scroll al top después de la navegación
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <>
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group" onClick={(e) => handleNavClick('/', e)}>
            <img
              src="/logo_plastitaps.png"
              alt="Plastitaps"
              className="h-8 sm:h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex space-x-8 font-inter font-semibold">
            {navLinks.map(({ to, label, end, hash }) => (
              hash ? (
                // Enlace a una sección dentro de Home — sin estado "activo" de NavLink,
                // porque to="/" con end=false haría que siempre se marque activo.
                <Link
                  key={label}
                  to={`${to}#${hash}`}
                  onClick={(e) => handleNavClick(to, e, hash)}
                  className="text-slate-600 hover:text-blue-500 transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={(e) => handleNavClick(to, e)}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-blue-600 transition-colors'
                      : 'text-slate-600 hover:text-blue-500 transition-colors'
                  }
                >
                  {label}
                </NavLink>
              )
            ))}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Auth Dropdown — Desktop */}
            <div className="relative hidden sm:block">
              {!user ? (
                 <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded-full font-bold transition-colors text-sm shadow-inner">
                   <User className="w-4 h-4" /> Ingresar
                 </Link>
              ) : (
                 <>
                   <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Menú de cuenta"
                    aria-expanded={showDropdown}
                    className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-slate-200 hover:border-blue-300 rounded-full shadow-sm transition-all text-sm font-bold text-slate-700 hover:bg-slate-50"
                   >
                     <img src={user.picture} alt="Profile" className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200" />
                     <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180': ''}`} />
                   </button>
                   
                   {showDropdown && (
                     <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-2 font-inter">
                       <div className="px-4 py-3 border-b border-slate-50 mb-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Verificado en Google</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                       </div>
                       <Link to="/perfil" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium">
                         <User className="w-4 h-4" /> Mi Perfil
                       </Link>
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium mt-1">
                         <LogOut className="w-4 h-4" /> Cerrar Sesión
                       </button>
                     </div>
                   )}
                 </>
              )}
            </div>

            {/* Cart */}
            <button onClick={() => setIsCartOpen(prev => !prev)} aria-label={`Ver cotización (${cartCount} producto${cartCount === 1 ? '' : 's'})`} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            
            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Menú Móvil Desplegable ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[280px] max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <img src="/logo_plastitaps.png" alt="Plastitaps" className="h-7 w-auto object-contain" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {navLinks.map(({ to, label, hash }) => {
                  const isActive = !hash && location.pathname === to;
                  return (
                    <button
                      key={label}
                      onClick={(e) => handleNavClick(to, e, hash)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Auth section — Mobile */}
              <div className="border-t border-slate-100 px-5 py-4">
                {!user ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm"
                  >
                    <User className="w-4 h-4" /> Ingresar
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <img src={user.picture} alt="Profile" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Verificado en Google</p>
                      </div>
                    </div>
                    <Link
                      to="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors font-medium"
                    >
                      <User className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
