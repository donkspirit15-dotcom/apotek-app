const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const token = () => localStorage.getItem('apotek:token');

async function req(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
    });
  } catch {
    alert('Tidak bisa terhubung ke server. Pastikan backend sudah jalan.');
    throw new Error('network');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('apotek:token');
    localStorage.removeItem('apotek:user');
    location.href = '/login';
    throw new Error('401');
  }
  if (!res.ok) {
    if (path !== '/auth/login') alert(data?.message || 'Terjadi kesalahan.');
    throw new Error(data?.message || 'error');
  }
  return data;
}

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  list: (t) => req('/' + t),
  save: (t, item) => (item.id
    ? req(`/${t}/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })
    : req(`/${t}`, { method: 'POST', body: JSON.stringify(item) })),
  remove: (t, id) => req(`/${t}/${id}`, { method: 'DELETE' }),
};
