// ponytail: hardcoded LAN/localhost base URL, no env-var plumbing for a hackathon build.
// Physical device on Expo Go can't reach "localhost" — set this to your machine's LAN IP.
export const API_URL = 'http://localhost:3001';

// Set by AuthContext on login/register/logout/rehydrate. A plain module variable is enough —
// there's only ever one active session per app instance.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Error ${res.status}`);
    err.status = res.status; // lets callers tell "session expired" (401) apart from other failures
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (name, email, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMe: () => request('/api/auth/me'),

  updateMe: (data) => request('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),

  listMedications: () => request('/api/medications'),
  addMedication: (data) => request('/api/medications', { method: 'POST', body: JSON.stringify(data) }),
  deleteMedication: (id) => request(`/api/medications/${id}`, { method: 'DELETE' }),

  addHealthMetric: (data) => request('/api/health-metrics', { method: 'POST', body: JSON.stringify(data) }),

  sendChatMessage: (message, history) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),

  doctorLogin: (email, password) =>
    request('/api/doctor/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  doctorLogout: () => request('/api/doctor/auth/logout', { method: 'POST' }),
  doctorGetMe: () => request('/api/doctor/auth/me'),
};
