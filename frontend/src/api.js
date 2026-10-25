const API_URL = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:4000/api`;

export async function api(path, options = {}) {
  const token = localStorage.getItem('sales-token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export const money = (value) => new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD'
}).format(Number(value || 0));

export const dateTime = (value) => value
  ? new Date(String(value).replace(' ', 'T')).toLocaleString()
  : '-';
