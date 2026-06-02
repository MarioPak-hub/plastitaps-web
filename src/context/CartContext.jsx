import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// La cotización es una lista simple de productos de interés (sin precios ni cantidades).
function validateCart(parsed) {
  if (!Array.isArray(parsed)) return false;
  return parsed.every(item => item && (item.id !== undefined && item.id !== null));
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('plastitaps-cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!validateCart(parsed)) { localStorage.removeItem('plastitaps-cart'); return []; }
      return parsed;
    } catch { localStorage.removeItem('plastitaps-cart'); return []; }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem('plastitaps-cart', JSON.stringify(cart)); }, [cart]);

  // Total de productos en la cotización (una línea por producto)
  const totalItems = cart.length;

  // ── Agregar a la cotización ────────────────────────────────────────────────
  // Sin validación de cantidad/MOQ: solo registra el producto de interés.
  // Si ya está en la cotización, no lo duplica.
  const addToCart = (product) => {
    setCart(prev => {
      if (prev.some(i => i.id === product.id)) return prev;
      return [...prev, { ...product }];
    });
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart      = () => setCart([]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart, removeFromCart, clearCart,
      isCartOpen, setIsCartOpen,
      totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
