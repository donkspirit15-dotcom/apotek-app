import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { enqueue, getQueue, hapusAntrian, syncQueue, uuid } from '../offline';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const dalamAntrian = (id) => getQueue().flatMap((x) => x.payload.items).filter((i) => i.obatId === id).reduce((t, i) => t + i.qty, 0);
const hariIni = () => { const d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };

export default function Kasir() {
  const { user } = useAuth();
  const [antrian, setAntrian] = useState(getQueue());
  const [produk, setProduk] = useState([]);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState('TUNAI');
  const [bayar, setBayar] = useState('');
  const [struk, setStruk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dVal, setDVal] = useState('');
  const [dUnit, setDUnit] = useState('Rp');

  const load = async () => {
    const [stok, obat] = await Promise.all([api.list('stok'), api.list('obat')]);
    const h = hariIni();
    setProduk(stok.map((s) => ({
      id: s.id, kode: s.kode, nama: s.nama, satuan: s.satuan,
      harga: obat.find((o) => o.id === s.id)?.harga_jual ?? 0,
      // hanya stok dari batch yang belum expired yang bisa dijual
      max: Math.max(0, s.batches.filter((b) => new Date(b.expired).getTime() >= h).reduce((t, b) => t + b.qty, 0) - dalamAntrian(s.id)),
    })));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const f = () => { setAntrian(getQueue()); load(); };
    window.addEventListener('antrian', f);
    return () => window.removeEventListener('antrian', f);
  }, []);

  const shown = produk.filter((p) => (p.kode + p.nama).toLowerCase().includes(q.toLowerCase()));
  const add = (p) => setCart((c) => {
    if (p.max < 1) return c;
    const ada = c.find((x) => x.id === p.id);
    if (ada) return c.map((x) => (x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, p.max) } : x));
    return [...c, { ...p, qty: 1 }];
  });
  const ubah = (id, d) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(x.qty + d, x.max)) } : x)));
  const hapus = (id) => setCart((c) => c.filter((x) => x.id !== id));

  const subtotal = cart.reduce((s, x) => s + x.qty * x.harga, 0);
  const diskon = Math.min(subtotal, Math.max(0, dUnit === '%' ? Math.round((subtotal * Number(dVal || 0)) / 100) : Number(dVal || 0)));
  const total = subtotal - diskon;
  const dibayar = metode === 'TUNAI' ? Number(bayar) : total;
  const kurang = dibayar < total;

  const proses = async () => {
    setBusy(true);
    const payload = {
      ref: uuid(), tanggal: new Date().toISOString(), metode, diskon, bayar: dibayar,
      items: cart.map((x) => ({ obatId: x.id, qty: x.qty })),
    };
    try {
      setStruk(await api.save('penjualan', payload, { diam: true }));
    } catch (e) {
      if (!e.offline) { alert(e.message); setBusy(false); return; }
      // tidak ada koneksi: simpan ke antrian, dikirim otomatis saat online lagi
      const struk = {
        id: 'OFFLINE', tanggal: payload.tanggal, kasir: user?.nama ?? '', metode, total, diskon, bayar: dibayar,
        kembalian: Math.max(0, dibayar - total), offline: true,
        items: cart.map((x) => ({ id: x.id, obatId: x.id, obat: { nama: x.nama }, qty: x.qty, harga: x.harga })),
      };
      enqueue(payload, struk);
      setStruk(struk);
    }
    setCart([]); setBayar(''); setDVal(''); setBusy(false); load();
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
        <div className="flex gap-2">
          <input type="number" min="0" className="input" placeholder="Diskon (opsional)" value={dVal} onChange={(e) => setDVal(e.target.value)} />
          <select className="input !w-20" value={dUnit} onChange={(e) => setDUnit(e.target.value)}><option>Rp</option><option>%</option></select>
        </div>
        {diskon > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Subtotal {rp(subtotal)}</span><span>Diskon −{rp(diskon)}</span></div>}
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

      {antrian.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 lg:col-span-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-amber-900">Penjualan menunggu sinkron ({antrian.length})</p>
            <button className="btn-ghost ml-auto" onClick={() => syncQueue()}>Sinkronkan sekarang</button>
          </div>
          {antrian.map((x) => (
            <div key={x.payload.ref} className="flex flex-wrap items-center gap-3 text-sm">
              <span>{new Date(x.payload.tanggal).toLocaleTimeString('id-ID')} · {rp(x.struk.total)} · {x.struk.items.map((i) => `${i.obat.nama} ×${i.qty}`).join(', ')}</span>
              {x.error && <span className="text-red-600">Gagal: {x.error}</span>}
              {x.error && (
                <button className="btn-ghost ml-auto text-red-600"
                  onClick={() => confirm('Hapus dari antrian? Transaksi ini tidak akan tercatat di server.') && hapusAntrian(x.payload.ref)}>Hapus</button>
              )}
            </div>
          ))}
        </div>
      )}

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
          <p className="text-center text-xs text-slate-500">{s.offline ? 'OFFLINE' : `#${s.id}`} · {new Date(s.tanggal).toLocaleString('id-ID')} · {s.kasir}</p>
          <hr className="my-2" />
          {baris.map((b) => (
            <div key={b.nama} className="flex justify-between"><span>{b.nama} ×{b.qty}</span><span>{rp(b.qty * b.harga)}</span></div>
          ))}
          <hr className="my-2" />
          {s.diskon > 0 && <div className="flex justify-between"><span>Diskon</span><span>−{rp(s.diskon)}</span></div>}
          <div className="flex justify-between font-bold"><span>Total</span><span>{rp(s.total)}</span></div>
          <div className="flex justify-between"><span>Bayar ({s.metode})</span><span>{rp(s.bayar)}</span></div>
          <div className="flex justify-between"><span>Kembalian</span><span>{rp(s.kembalian)}</span></div>
          <p className="pt-2 text-center text-xs text-slate-500">Terima kasih</p>
          {s.offline && <p className="text-center text-xs text-amber-700">Belum tersinkron ke server</p>}
        </div>
        <div className="no-print mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Tutup</button>
          <button className="btn" onClick={() => window.print()}>Cetak struk</button>
        </div>
      </div>
    </div>
  );
}
