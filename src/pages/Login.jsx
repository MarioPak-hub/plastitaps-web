import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

// Logo G de Google inline (evita assets externos)
const GoogleGLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, loginWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 animate-spin" />
    </div>
  );

  if (user && user.profileComplete) return <Navigate to="/perfil" replace />;

  const handleLogin = async () => {
    if (signingIn) return;
    setError('');
    setSigningIn(true);
    try {
      const freshUser = await loginWithGoogle();
      navigate(freshUser.profileComplete ? '/perfil' : '/completar-perfil', { replace: true });
    } catch (err) {
      // Errores típicos: auth/popup-closed-by-user, auth/cancelled-popup-request, auth/popup-blocked
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // Cancelación voluntaria — sin mensaje ruidoso
        console.info('[Plastitaps SSO] popup cerrado por el usuario.');
      } else if (code === 'auth/popup-blocked') {
        setError('Tu navegador bloqueó la ventana emergente. Habilita los pop-ups e intenta de nuevo.');
      } else {
        console.error('[Plastitaps SSO] Firebase Auth falló:', err);
        setError('No pudimos iniciar sesión. Intenta de nuevo en unos segundos.');
      }
    } finally {
      setSigningIn(false);
    }
  };

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

          <button
            type="button"
            onClick={handleLogin}
            disabled={signingIn}
            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full
                       bg-white border border-slate-300 text-slate-700 font-semibold text-sm
                       shadow-sm hover:shadow-md hover:bg-slate-50
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 hover:scale-105"
          >
            {signingIn ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
                Conectando…
              </>
            ) : (
              <>
                <GoogleGLogo />
                Continuar con Google
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-600 text-center font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 text-xs text-center text-slate-400 font-medium px-4 border-t border-slate-100 pt-6">
            Al identificarte, aceptas los términos de uso del portal B2B y nuestra política de privacidad corporativa.
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
