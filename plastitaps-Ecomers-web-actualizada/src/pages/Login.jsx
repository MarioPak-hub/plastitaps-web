import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

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

        <div className="w-full bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(37,99,235,0.06)] border border-slate-200 flex flex-col items-center">
          <h3 className="text-center font-bold text-slate-700 mb-6">Continuar con Google Workspace</h3>

          {/* 
            GoogleLogin renders ONE isolated button managed by @react-oauth/google.
            The GoogleOAuthProvider in App.jsx calls initialize() ONCE at mount.
            Do NOT call google.accounts.id.initialize() anywhere else.
            useOneTap is intentionally OMITTED to prevent double-initialization.
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
