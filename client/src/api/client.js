const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// AuthContext calls setToken() after login/signup so every request after
// that point carries the token automatically, without every hook having
// to know about auth.
let authToken = null;

function setToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function get(path) {
  return request(path, { method: 'GET' });
}

function post(path, data) {
  return request(path, { method: 'POST', body: JSON.stringify(data) });
}

function patch(path, data) {
  return request(path, { method: 'PATCH', body: JSON.stringify(data) });
}

function del(path) {
  return request(path, { method: 'DELETE' });
}

export const apiClient = { get, post, patch, del, setToken };
