import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// Detecta si el Client ID es el placeholder de desarrollo
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const IS_MOCK_CLIENT = !CLIENT_ID || CLIENT_ID === 'mock-client-id';

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, loginWithGoogle } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 animate-spin" />
    </div>
  );

  if (user && user.profileComplete) return <Navigate to="/perfil" replace />;

  const handleSuccess = (credentialResponse) => {
    const freshUser = loginWithGoogle(credentialResponse);
    navigate(freshUser.profileComplete ? '/perfil' : '/completar-perfil', { replace: true });
  };

  const handleError = () => console.error('[Plastitaps SSO] Google auth was cancelled or failed.');

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black font-outfit mb-2 text-center text-slate-900 tracking-tight">Portal B2B</h1>
        <p className="text-slate-500 mb-8 text-center text-sm font-medium">
          Autenticación corporativa requerida. Tu sesión está protegida bajo estándares internacionales.
        </p>

        {/* Aviso de desarrollo cuando no hay Client ID configurado */}
        {IS_MOCK_CLIENT && (
          <div className="w-full mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-bold mb-1">Configuración pendiente</p>
              <p className="text-xs leading-relaxed">
                Agrega <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code> en el archivo{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> para activar el login con Google.
              </p>
            </div>
          </div>
        )}

        <div className="w-full bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(37,99,235,0.06)] border border-slate-200 flex flex-col items-center">
          <h3 className="text-center font-bold text-slate-700 mb-6">Continuar con Google Workspace</h3>

          {/*
            GoogleLogin con ux_mode="popup" para evitar redirección en localhost.
            Acepta cualquier cuenta de Google — no hay restricción de dominio en el código.
            Solo el Client ID en .env determina qué proyecto de Google Cloud se usa.
          */}
          <div className="hover:scale-105 transition-transform duration-300">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              shape="pill"
              theme="outline"
              size="large"
              text="continue_with"
              logo_alignment="left"
              ux_mode="popup"
            />
          </div>

          <div className="mt-8 text-xs text-center text-slate-400 font-medium px-4 border-t border-slate-100 pt-6">
            Al identificarte, aceptas los términos de uso del portal B2B y nuestra política de privacidad corporativa.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
