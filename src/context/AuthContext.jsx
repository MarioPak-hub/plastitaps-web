import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

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

  const loginWithGoogle = (credentialResponse) => {
    // Decode the Google JWT to extract PII (name, email, picture).
    // In production, send credential to backend to verify signature server-side.
    const base64Url = credentialResponse.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const payload = JSON.parse(jsonPayload);

    // ── CRITICAL SECURITY: Full reset on every login ─────────────────────────
    // Wipe previous session COMPLETELY before persisting new identity.
    // Prevents stale/mixed identity state when accounts are switched.
    localStorage.removeItem(USER_PROFILE_KEY);
    Cookies.remove(AUTH_TOKEN_KEY);
    // ─────────────────────────────────────────────────────────────────────────

    // Re-hydrate with real Google data
    const existingProfile = (() => {
      // Check if this specific email already completed B2B profile
      const raw = localStorage.getItem(USER_PROFILE_KEY + '_' + payload.email);
      return raw ? JSON.parse(raw) : null;
    })();

    const activeUser = existingProfile
      ? { ...existingProfile, name: payload.name, picture: payload.picture, email: payload.email }
      : { email: payload.email, name: payload.name, picture: payload.picture, profileComplete: false };

    // Set session token (HttpOnly-like simulation)
    Cookies.set(AUTH_TOKEN_KEY, btoa(payload.email + ':' + Date.now()), {
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, completeProfile, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
