const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'dc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. It may be waking up, try again in a moment.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status);
  return data;
}
