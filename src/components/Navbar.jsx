import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, Hexagon, User, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const cartCount = totalItems || 0;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(37,99,235,0.3)]">
            <Hexagon className="text-white w-6 h-6" />
          </div>
          <span className="font-outfit font-black text-2xl tracking-tighter text-slate-800">
            Plasti<span className="text-blue-600">taps</span>
          </span>
        </Link>
        <div className="hidden md:flex space-x-8 font-inter font-semibold">
          {[
            { to: '/',               label: 'Inicio',              end: true  },
            { to: '/catalogo',       label: 'Catálogo Técnico',    end: false },
            { to: '/disena-tu-vaso', label: 'Personalizador Vaso', end: false },
            { to: '/contacto',       label: 'Contacto',            end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-600 transition-colors'
                  : 'text-slate-600 hover:text-blue-500 transition-colors'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          
          {/* Auth Dropdown */}
          <div className="relative">
            {!user ? (
               <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 rounded-full font-bold transition-colors text-sm shadow-inner">
                 <User className="w-4 h-4" /> Ingresar
               </Link>
            ) : (
               <>
                 <button 
                  onClick={() => setShowDropdown(!showDropdown)}
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

          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">
                {cartCount}
              </span>
            )}
          </button>
          
          <button className="md:hidden p-2 text-slate-600 hover:text-blue-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
