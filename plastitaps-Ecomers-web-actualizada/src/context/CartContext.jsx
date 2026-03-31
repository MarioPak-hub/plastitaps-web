import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Products with id starting with 'pc' are promotional (Stripe)
// Everything else is industrial (PDF quotation)
const isPromo = (item) => String(item.id).startsWith('pc');

function validateCart(parsed) {
  if (!Array.isArray(parsed)) return false;
  return parsed.every(
    item => typeof item.price === 'number' && !isNaN(item.price) &&
            typeof item.moq   === 'number' && !isNaN(item.moq)
  );
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

  const [isCartOpen,  setIsCartOpen]  = useState(false);
  const [moqError,    setMoqError]    = useState(null);

  useEffect(() => { localStorage.setItem('plastitaps-cart', JSON.stringify(cart)); }, [cart]);

  // ── Split cart by type ────────────────────────────────────────────────────
  const promoItems      = cart.filter(isPromo);
  const industrialItems = cart.filter(i => !isPromo(i));

  // Cart type for smart header, not for restricting flow
  const cartType = cart.length === 0 ? 'empty'
    : promoItems.length > 0 && industrialItems.length > 0 ? 'mixed'
    : promoItems.length > 0 ? 'promo' : 'industrial';

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalItems      = cart.reduce((a, c) => a + (Number(c.quantity) || 0), 0);
  const totalPrice      = cart.reduce((a, c) => a + (Number(c.quantity) || 0) * (Number(c.price) || 0), 0);
  const promoTotal      = promoItems.reduce((a, c) => a + (Number(c.quantity) || 0) * (Number(c.price) || 0), 0);
  const industrialTotal = industrialItems.reduce((a, c) => a + (Number(c.quantity) || 0) * (Number(c.price) || 0), 0);

  // ── Add to cart with MOQ validation ──────────────────────────────────────
  const addToCart = (product, qty = null) => {
    const requestedQty = qty ?? product.moq ?? 1;
    if (requestedQty < (product.moq || 1)) {
      setMoqError({ name: product.name, moq: product.moq, unit: product.unit });
      setTimeout(() => setMoqError(null), 4000);
      return false;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + requestedQty } : i);
      return [...prev, { ...product, quantity: requestedQty }];
    });
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart      = () => setCart([]);
  const clearPromoCart = () => setCart(prev => prev.filter(i => !isPromo(i)));

  const updateQuantity = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    const item = cart.find(i => i.id === id);
    if (item && qty < (item.moq || 1)) {
      setMoqError({ name: item.name, moq: item.moq, unit: item.unit });
      setTimeout(() => setMoqError(null), 4000);
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  return (
    <CartContext.Provider value={{
      cart, promoItems, industrialItems, cartType,
      addToCart, removeFromCart, updateQuantity, clearCart, clearPromoCart,
      isCartOpen, setIsCartOpen,
      moqError,
      totalItems, totalPrice, promoTotal, industrialTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
