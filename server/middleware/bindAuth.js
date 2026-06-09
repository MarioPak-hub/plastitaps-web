// ─────────────────────────────────────────────────────────────────────────────
// bindAuth — valida que las requests entrantes vengan de Bind Automations
// Espera header `X-Bind-Key` igual a `process.env.BIND_INCOMING_KEY`
// ─────────────────────────────────────────────────────────────────────────────
export function bindAuth(req, res, next) {
  const key      = req.headers['x-bind-key'];
  const expected = process.env.BIND_INCOMING_KEY;

  if (!expected) {
    console.error('[bindAuth] BIND_INCOMING_KEY no configurada — rechazando todas las requests entrantes.');
    return res.status(503).json({ error: 'Webhook entrante no configurado.' });
  }

  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
