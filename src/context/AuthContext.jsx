import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { signInWithGooglePopup, signOutFromFirebase } from '../firebase';

const AuthContext = createContext();
const AUTH_TOKEN_KEY = '__plastitaps_secure_auth';
const USER_PROFILE_KEY = '__plastitaps_user_profile';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate session from persistent cookie + profile on mount (ONCE)
    const token = Cookies.get(AUTH_TOKEN_KEY);
    const profileData = localStorage.getItem(USER_PROFILE_KEY);
    if (token && profileData) {
      try {
        setUser(JSON.parse(profileData));
      } catch {
        // Corrupted storage – clean slate
        localStorage.removeItem(USER_PROFILE_KEY);
        Cookies.remove(AUTH_TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login con Google vía Firebase Auth (popup).
   * Firebase Auth queda autenticado → Firestore rules ven request.auth.uid.
   * Lanza si el usuario cancela el popup o Firebase rechaza — el caller debe try/catch.
   */
  const loginWithGoogle = async () => {
    const fbUser = await signInWithGooglePopup();

    // Mapeo Firebase User → shape del contexto
    const profile = {
      email:   fbUser.email,
      name:    fbUser.displayName || fbUser.email,
      picture: fbUser.photoURL    || null,
    };

    // ── CRITICAL SECURITY: Full reset on every login ─────────────────────────
    // Wipe previous session COMPLETELY before persisting new identity.
    // Prevents stale/mixed identity state when accounts are switched.
    localStorage.removeItem(USER_PROFILE_KEY);
    Cookies.remove(AUTH_TOKEN_KEY);
    // ─────────────────────────────────────────────────────────────────────────

    // Check if this specific email already completed B2B profile
    const existingProfile = (() => {
      const raw = localStorage.getItem(USER_PROFILE_KEY + '_' + profile.email);
      return raw ? JSON.parse(raw) : null;
    })();

    const activeUser = existingProfile
      ? { ...existingProfile, ...profile }
      : { ...profile, profileComplete: false };

    // Set session token (HttpOnly-like simulation)
    Cookies.set(AUTH_TOKEN_KEY, btoa(profile.email + ':' + Date.now()), {
      secure: true, sameSite: 'strict', expires: 1
    });

    // Persist for this session
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(activeUser));

    setUser(activeUser);
    return activeUser; // Returned so caller can redirect immediately
  };

  const completeProfile = (corporateData) => {
    // Force RFC to uppercase as a last line of defense
    if (corporateData.rfc) corporateData.rfc = corporateData.rfc.toUpperCase();
    const updatedUser = { ...user, ...corporateData, profileComplete: true };
    setUser(updatedUser);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
    // Also persist under the email-specific key for future logins
    localStorage.setItem(USER_PROFILE_KEY + '_' + updatedUser.email, JSON.stringify(updatedUser));
  };

  const updateProfile = (partialData) => {
    if (!user) return;
    const updatedUser = { ...user, ...partialData };
    setUser(updatedUser);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
    if (updatedUser.email) {
      localStorage.setItem(USER_PROFILE_KEY + '_' + updatedUser.email, JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    Cookies.remove(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    setUser(null);
    signOutFromFirebase().catch(err =>
      console.warn('[Firebase Auth] signOut failed:', err?.message || err)
    );
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, completeProfile, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
