import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import InteractiveDesign from './pages/InteractiveDesign';
import Checkout from './pages/Checkout';
import StripeCheckout from './pages/StripeCheckout';
import Promocionales from './pages/Promocionales';
import Login from './pages/Login';
import Account from './pages/Account';
import CompleteProfile from './pages/CompleteProfile';
import CarritoCheckout from './pages/CarritoCheckout';
import PagoExitoso from './pages/PagoExitoso';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import FloatingChatbot from './components/FloatingChatbot';
import ProductModal from './components/ProductModal';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import productsData from './data/products.json';
import retailProducts from './data/retail_products.json';
import promoCatalog from './data/promo_catalog.json';

const allProducts = [...productsData, ...retailProducts, ...promoCatalog];

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id';

export default function App() {
  const [globalProduct, setGlobalProduct] = useState(null);

  const openProductBySlug = (slug, initialQty = null) => {
    const product = allProducts.find(p => (p.slug || String(p.id)) === slug);
    if (product) {
      if (initialQty) {
        product._initialQty = initialQty;
      }
      setGlobalProduct(product);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Cart />
            <FloatingChatbot onProductClick={openProductBySlug} />
            <ProductModal selectedProduct={globalProduct} onClose={() => setGlobalProduct(null)} />
            <Routes>
              {/* Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/disena-tu-vaso" element={<InteractiveDesign openProductBySlug={openProductBySlug} />} />
              <Route path="/promocionales" element={<Promocionales openProductBySlug={openProductBySlug} />} />
              <Route path="/catalogo" element={<Catalog openProductBySlug={openProductBySlug} />} />
              <Route path="/carrito" element={<CarritoCheckout />} />
              <Route path="/pago-exitoso" element={<PagoExitoso />} />
              <Route path="/login" element={<Login />} />
              <Route path="/completar-perfil" element={<CompleteProfile />} />

              {/* Protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pagar" element={<StripeCheckout />} />
                <Route path="/perfil" element={<Account />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
