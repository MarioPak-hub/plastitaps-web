// ─────────────────────────────────────────────────────────────────────────────
// Firebase init — Firestore para persistencia de cotizaciones (B2B audit trail)
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialise once (StrictMode + HMR safe)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

/**
 * Login con Google vía popup de Firebase Auth.
 * Devuelve el `User` de Firebase (email, displayName, photoURL, uid, ...).
 * Lanza si el usuario cierra el popup o si Firebase rechaza el provider.
 */
export async function signInWithGooglePopup() {
  // Provider nuevo por llamada — evita estado compartido entre logins
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' }); // siempre mostrar selector de cuenta
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function signOutFromFirebase() {
  return signOut(auth);
}

export default app;
