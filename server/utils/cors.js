// Decides whether a browser Origin may call the API.
//
// The origin is parsed and its hostname compared exactly. The old check used
// origin.includes('vercel.app') / includes('localhost'), which also matched
// lookalike hosts such as https://vercel.app.evil.com or http://localhost.evil.com.

const normalizeOrigin = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).origin;
  } catch (_) {
    return null;
  }
};

const isOriginAllowed = (origin, env = process.env) => {
  // Requests without an Origin header (curl, server-to-server, same-origin)
  if (!origin) return true;

  let url;
  try {
    url = new URL(origin);
  } catch (_) {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname;

  // Local development
  if (host === 'localhost' || host === '127.0.0.1') return true;

  // Vercel deployments and previews (https only, real subdomain of vercel.app).
  // Set CORS_STRICT=true to turn this off and rely on the explicit list below.
  if (env.CORS_STRICT !== 'true' && url.protocol === 'https:' && host.endsWith('.vercel.app')) {
    return true;
  }

  // Explicit allow-list: FRONTEND_URL plus comma-separated ALLOWED_ORIGINS
  const configured = [env.FRONTEND_URL, ...(env.ALLOWED_ORIGINS || '').split(',')]
    .map(normalizeOrigin)
    .filter(Boolean);
  return configured.includes(url.origin);
};

module.exports = { isOriginAllowed, normalizeOrigin };
