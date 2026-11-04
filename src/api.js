const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const token = () => localStorage.getItem('apotek:token');

// opts.diam = true -> tidak menampilkan alert (pemanggil menangani error sendiri)
async function req(path, opts = {}) {
  const { diam, ...init } = opts;
  let res;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) },
    });
  } catch {
    const e = new Error('Tidak bisa terhubung ke server.');
    e.offline = true;
    if (!diam) alert('Tidak bisa terhubung ke server. Periksa koneksi internet atau pastikan backend sudah jalan.');
    throw e;
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('apotek:token');
    localStorage.removeItem('apotek:user');
    location.href = '/login';
    throw new Error('401');
  }
  if (!res.ok) {
    const msg = data?.message || 'Terjadi kesalahan.';
    if (!diam && path !== '/auth/login') alert(msg);
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return data;
}

export const api = {
  login: (username, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  list: (t) => req('/' + t),
  save: (t, item, opts) => (item.id
    ? req(`/${t}/${item.id}`, { ...opts, method: 'PUT', body: JSON.stringify(item) })
    : req(`/${t}`, { ...opts, method: 'POST', body: JSON.stringify(item) })),
  remove: (t, id) => req(`/${t}/${id}`, { method: 'DELETE' }),
};
