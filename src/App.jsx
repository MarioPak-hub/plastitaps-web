import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import InteractiveDesign from './pages/InteractiveDesign';
import Checkout from './pages/Checkout';
import Promocionales from './pages/Promocionales';
import Login from './pages/Login';
import Account from './pages/Account';
import CompleteProfile from './pages/CompleteProfile';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './components/Cart';
import FloatingChatbot from './components/FloatingChatbot';
import ProductModal from './components/ProductModal';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { QuotesProvider } from './context/QuotesContext';

import productsData from './data/products.json';
import retailProducts from './data/retail_products.json';
import promoCatalog from './data/promo_catalog.json';

const allProducts = [...productsData, ...retailProducts, ...promoCatalog];

export default function App() {
  const [globalProduct, setGlobalProduct] = useState(null);

  const openProductBySlug = (slug) => {
    const product = allProducts.find(p => (p.slug || String(p.id)) === slug);
    if (product) setGlobalProduct(product);
  };

  return (
    <AuthProvider>
      <QuotesProvider>
        <CartProvider>
          <BrowserRouter>
            <Cart />
            <FloatingChatbot onProductClick={openProductBySlug} />
            <ProductModal selectedProduct={globalProduct} onClose={() => setGlobalProduct(null)} />
            <Routes>
              {/* Públicas */}
              <Route path="/" element={<Home openProductBySlug={openProductBySlug} />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/disena-tu-vaso" element={<InteractiveDesign openProductBySlug={openProductBySlug} />} />
              <Route path="/promocionales" element={<Promocionales openProductBySlug={openProductBySlug} />} />
              <Route path="/catalogo" element={<Catalog openProductBySlug={openProductBySlug} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/completar-perfil" element={<CompleteProfile />} />

              {/* Protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/perfil" element={<Account />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </QuotesProvider>
    </AuthProvider>
  );
}
