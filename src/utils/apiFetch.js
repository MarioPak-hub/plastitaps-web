// ─────────────────────────────────────────────────────────────────────────────
// apiFetch — fetch wrapper que respeta VITE_API_BASE_URL para producción.
// En desarrollo VITE_API_BASE_URL queda vacío y se usa el proxy de Vite.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const apiFetch = (path, opts) => {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return fetch(url, opts);
};

export default apiFetch;
