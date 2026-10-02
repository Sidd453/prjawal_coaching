const TOKEN_KEY = 'pu_admin_token';
const API_BASE = window.API_BASE || '';

export const auth = {
  get token() { return localStorage.getItem(TOKEN_KEY); },
  set token(v) { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); },
};

export const request = async (path, { method = 'GET', body, query } = {}) => {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null)) : '';
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}${qs}`, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(auth.token && { Authorization: `Bearer ${auth.token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login') {
    auth.token = null;
    window.dispatchEvent(new Event('auth:expired'));
  }
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

export const api = {
  get: (p, query) => request(p, { query }),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body: body || {} }),
  del: (p) => request(p, { method: 'DELETE' }),
};
