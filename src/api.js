// Mock API berbasis localStorage. Minggu 2+: ganti isi fungsi ini dengan fetch() ke backend Express,
// komponen lain tidak perlu diubah.
const KEY = 'apotek:';
const seed = {
  kategori: [{ id: 1, nama: 'Obat bebas' }, { id: 2, nama: 'Obat keras' }, { id: 3, nama: 'Vitamin' }],
  supplier: [{ id: 1, nama: 'PT Contoh Farma', telepon: '021-5551234', alamat: 'Jakarta' }],
  obat: [{ id: 1, kode: 'OBT-001', nama: 'Paracetamol 500 mg', kategori: 'Obat bebas', satuan: 'Strip', harga_beli: 3000, harga_jual: 4500, stok_min: 20 }],
};
const read = (t) => {
  try { const v = localStorage.getItem(KEY + t); if (v) return JSON.parse(v); } catch {}
  return seed[t] || [];
};
const write = (t, d) => { try { localStorage.setItem(KEY + t, JSON.stringify(d)); } catch {} };

export const api = {
  list: async (t) => read(t),
  save: async (t, item) => {
    const d = read(t);
    if (item.id) { write(t, d.map((x) => (x.id === item.id ? item : x))); return item; }
    const n = { ...item, id: Date.now() };
    write(t, [...d, n]);
    return n;
  },
  remove: async (t, id) => write(t, read(t).filter((x) => x.id !== id)),
};
