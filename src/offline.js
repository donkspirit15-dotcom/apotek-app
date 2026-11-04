import { api } from './api';

// Antrian penjualan yang dibuat saat offline. Disimpan di localStorage, dikirim otomatis saat online.
const KEY = 'apotek:antrian';
const baca = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const tulis = (q) => {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* penyimpanan penuh/diblokir */ }
  window.dispatchEvent(new Event('antrian'));
};

export const uuid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const getQueue = baca;
export const jumlahAntrian = () => baca().length;
export const enqueue = (payload, struk) => tulis([...baca(), { payload, struk, error: null }]);
export const hapusAntrian = (ref) => tulis(baca().filter((x) => x.payload.ref !== ref));

let jalan = false;
export async function syncQueue() {
  if (jalan) return;
  jalan = true;
  try {
    for (const it of baca()) {
      const ref = it.payload.ref;
      try {
        await api.save('penjualan', it.payload, { diam: true });
        tulis(baca().filter((x) => x.payload.ref !== ref));
      } catch (e) {
        if (e.offline) break; // masih offline, coba lagi nanti
        if (e.status === 409) { tulis(baca().filter((x) => x.payload.ref !== ref)); continue; } // sudah pernah tercatat
        tulis(baca().map((x) => (x.payload.ref === ref ? { ...x, error: e.message } : x)));
      }
    }
  } finally { jalan = false; }
}
