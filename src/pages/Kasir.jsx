import { useEffect, useState } from 'react';
import { api } from '../api';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const hariIni = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };

export default function Kasir() {
  const [produk, setProduk] = useState([]);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState('TUNAI');
  const [bayar, setBayar] = useState('');
  const [struk, setStruk] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [stok, obat] = await Promise.all([api.list('stok'), api.list('obat')]);
    const h = hariIni();
    setProduk(stok.map((s) => ({
      id: s.id, kode: s.kode, nama: s.nama, satuan: s.satuan,
      harga: obat.find((o) => o.id === s.id)?.harga_jual ?? 0,
      // hanya stok dari batch yang belum expired yang bisa dijual
      max: s.batches.filter((b) => new Date(b.expired).getTime() >= h).reduce((t, b) => t + b.qty, 0),
    })));
  };
  useEffect(() => { load(); }, []);

  const shown = produk.filter((p) => (p.kode + p.nama).toLowerCase().includes(q.toLowerCase()));
  const add = (p) => setCart((c) => {
    if (p.max < 1) return c;
    const ada = c.find((x) => x.id === p.id);
    if (ada) return c.map((x) => (x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, p.max) } : x));
    return [...c, { ...p, qty: 1 }];
  });
  const ubah = (id, d) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(x.qty + d, x.max)) } : x)));
  const hapus = (id) => setCart((c) => c.filter((x) => x.id !== id));

  const total = cart.reduce((s, x) => s + x.qty * x.harga, 0);
  const dibayar = metode === 'TUNAI' ? Number(bayar) : total;
  const kurang = dibayar < total;

  const proses = async () => {
    setBusy(true);
    try {
      const res = await api.save('penjualan', { metode, bayar: dibayar, items: cart.map((x) => ({ obatId: x.id, qty: x.qty })) });
      setStruk(res); setCart([]); setBayar(''); load();
    } catch { /* pesan error sudah ditampilkan oleh api.js */ } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-2xl font-bold text-ink">Kasir</h2>
          <input autoFocus className="input !w-72" placeholder="Cari nama atau scan kode obat..." value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && shown.length === 1) { add(shown[0]); setQ(''); } }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <button key={p.id} disabled={p.max < 1} onClick={() => add(p)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
              <p className="font-semibold">{p.nama}</p>
              <p className="text-xs text-slate-500">{p.kode} · {p.satuan}</p>
              <p className="mt-2 font-bold text-brand">{rp(p.harga)}</p>
              <p className="text-xs text-slate-500">{p.max > 0 ? `Stok ${p.max}` : 'Habis / expired'}</p>
            </button>
          ))}
          {!shown.length && <p className="col-span-full py-10 text-center text-slate-400">Obat tidak ditemukan.</p>}
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
        <h3 className="font-bold text-ink">Keranjang</h3>
        {!cart.length && <p className="text-sm text-slate-400">Klik obat untuk menambahkan.</p>}
        {cart.map((x) => (
          <div key={x.id} className="space-y-1 border-b border-slate-100 pb-3">
            <div className="flex justify-between text-sm"><span className="font-medium">{x.nama}</span><span>{rp(x.qty * x.harga)}</span></div>
            <div className="flex items-center gap-2 text-sm">
              <button className="btn-ghost !px-2.5" onClick={() => ubah(x.id, -1)}>−</button>
              <span className="w-8 text-center">{x.qty}</span>
              <button className="btn-ghost !px-2.5" onClick={() => ubah(x.id, 1)}>+</button>
              <span className="text-xs text-slate-400">× {rp(x.harga)}</span>
              <button className="ml-auto text-xs text-red-600" onClick={() => hapus(x.id)}>Hapus</button>
            </div>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold text-ink"><span>Total</span><span>{rp(total)}</span></div>
        <select className="input" value={metode} onChange={(e) => setMetode(e.target.value)}>
          <option value="TUNAI">Tunai</option><option value="QRIS">QRIS</option><option value="DEBIT">Debit</option>
        </select>
        {metode === 'TUNAI' && (
          <>
            <input type="number" min="0" className="input" placeholder="Uang diterima" value={bayar} onChange={(e) => setBayar(e.target.value)} />
            <p className="text-sm text-slate-600">Kembalian: <b>{rp(Math.max(0, dibayar - total))}</b></p>
          </>
        )}
        <button className="btn w-full disabled:opacity-50" disabled={!cart.length || kurang || busy} onClick={proses}>
          {busy ? 'Memproses...' : 'Bayar'}
        </button>
      </aside>

      {struk && <Struk s={struk} onClose={() => setStruk(null)} />}
    </div>
  );
}

function Struk({ s, onClose }) {
  const baris = Object.values(s.items.reduce((m, i) => {
    m[i.obatId] = m[i.obatId] ? { ...m[i.obatId], qty: m[i.obatId].qty + i.qty } : { nama: i.obat.nama, qty: i.qty, harga: i.harga };
    return m;
  }, {}));
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div id="struk" className="space-y-1 text-sm">
          <p className="text-center text-lg font-bold">Apotek</p>
          <p className="text-center text-xs text-slate-500">#{s.id} · {new Date(s.tanggal).toLocaleString('id-ID')} · {s.kasir}</p>
          <hr className="my-2" />
          {baris.map((b) => (
            <div key={b.nama} className="flex justify-between"><span>{b.nama} ×{b.qty}</span><span>{rp(b.qty * b.harga)}</span></div>
          ))}
          <hr className="my-2" />
          <div className="flex justify-between font-bold"><span>Total</span><span>{rp(s.total)}</span></div>
          <div className="flex justify-between"><span>Bayar ({s.metode})</span><span>{rp(s.bayar)}</span></div>
          <div className="flex justify-between"><span>Kembalian</span><span>{rp(s.kembalian)}</span></div>
          <p className="pt-2 text-center text-xs text-slate-500">Terima kasih</p>
        </div>
        <div className="no-print mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Tutup</button>
          <button className="btn" onClick={() => window.print()}>Cetak struk</button>
        </div>
      </div>
    </div>
  );
}
