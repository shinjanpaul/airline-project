const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Token ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (data: Record<string, string>) =>
    request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  me: () => request('/auth/me/'),

getFlights: (params?: Record<string, string>) => {
    const filtered = params ? Object.fromEntries(Object.entries(params).filter(([,v]) => v)) : {};
    const q = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/flights/${q}`);
  },
  getFlight: (id: number) => {
    if (!id || isNaN(id)) return Promise.reject('Invalid flight ID');
    return request(`/flights/${id}/`);
  },
  createFlight: (data: Record<string, unknown>) =>
    request('/flights/', { method: 'POST', body: JSON.stringify(data) }),
  updateFlight: (id: number, data: Record<string, unknown>) =>
    request(`/flights/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  getReservations: () => request('/reservations/'),
  createReservation: (data: Record<string, unknown>) =>
    request('/reservations/', { method: 'POST', body: JSON.stringify(data) }),
  cancelTicket: (data: Record<string, string>) =>
    request('/reservations/cancel/', { method: 'POST', body: JSON.stringify(data) }),
  getAllReservations: () => request('/reservations/all/'),

  getDashboard: () => request('/dashboard/'),
  getReports: () => request('/reports/'),
};

export function saveAuth(token: string, user: Record<string, unknown>) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
export function getUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
