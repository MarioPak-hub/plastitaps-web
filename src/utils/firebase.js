// Firebase Cloud Storage utility — lazy-loaded only when credentials are present
let _initialized = false;
let _storage = null;

async function initStorage() {
  if (_initialized) return _storage;
  _initialized = true;

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getStorage }             = await import('firebase/storage');
    const config = {
      apiKey,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const app = getApps().length ? getApps()[0] : initializeApp(config);
    _storage = getStorage(app);
  } catch (e) {
    console.warn('[Firebase] init error:', e.message);
    _storage = null;
  }
  return _storage;
}

export async function uploadLogoToStorage(file, folio) {
  const store = await initStorage();
  if (!store) {
    console.warn('[Firebase] Storage not configured — logo URL will be null');
    return null;
  }
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const ext      = file.name.split('.').pop();
  const fileRef  = ref(store, `logos/${folio}.${ext}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
