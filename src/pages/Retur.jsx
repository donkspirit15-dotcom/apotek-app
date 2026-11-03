import { useEffect, useState } from 'react';
import { api } from '../api';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const waktu = (d) => new Date(d).toLocaleString('id-ID');
const ALASAN = ['Salah beli / berubah pikiran', 'Obat rusak / cacat', 'Salah resep', 'Lainnya'];

export default function Retur() {
  const [jual, setJual] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState({});
  const [kembali, setKembali] = useState({});
  const [alasan, setAlasan] = useState('');

  const load = async () => {
    const [a, b] = await Promise.all([api.list('penjualan'), api.list('retur')]);
    setJual(a); setRiwayat(b);
  };
  useEffect(() => { load(); }, []);

  const sudah = (p, id) => p.returs.flatMap((r) => r.items).filter((i) => i.penjualanItemId === id).reduce((s, i) => s + i.qty, 0);
  const buka = (p) => { setSel(p); setQty({}); setKembali({}); setAlasan(''); };
  const rasio = sel && sel.total + sel.diskon > 0 ? sel.total / (sel.total + sel.diskon) : 1;
  const pilih = sel ? sel.items.filter((i) => Number(qty[i.id]) > 0) : [];
  const refund = pilih.reduce((s, i) => s + Math.round(Number(qty[i.id]) * i.harga * rasio), 0);
  const shown = jual.filter((p) => (`#${p.id} ` + p.items.map((i) => i.obat.nama).join(' ')).toLowerCase().includes(q.toLowerCase()));

  const kirim = async () => {
    if (!alasan) return alert('Pilih alasan retur.');
    try {
      await api.save('retur', {
        penjualanId: sel.id, alasan,
        items: pilih.map((i) => ({ penjualanItemId: i.id, qty: Number(qty[i.id]), kembaliStok: kembali[i.id] !== false })),
      });
      setSel(null); load();
    } catch { /* pesan error sudah ditampilkan oleh api.js */ }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-2xl font-bold text-ink">Retur penjualan</h2>
          <input className="input !w-72" placeholder="Cari nomor (#12) atau nama obat..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{['No.', 'Waktu', 'Barang', 'Total', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">#{p.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{waktu(p.tanggal)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.items.map((i) => `${i.obat.nama} ×${i.qty}`).join(', ')}</td>
                  <td className="px-4 py-3 font-medium">{rp(p.total)}</td>
                  <td className="px-4 py-3 text-right"><button className="btn-ghost" onClick={() => buka(p)}>Retur</button></td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Tidak ada penjualan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-ink">Riwayat retur</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{['No.', 'Waktu', 'Dari', 'Barang', 'Alasan', 'Dikembalikan'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {riwayat.map((x) => (
                <tr key={x.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">#{x.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{waktu(x.tanggal)}</td>
                  <td className="px-4 py-3">Penjualan #{x.penjualanId}</td>
                  <td className="px-4 py-3 text-slate-600">{x.items.map((i) => `${i.obat.nama} ×${i.qty}${i.kembaliStok ? '' : ' (tidak ke stok)'}`).join(', ')}</td>
                  <td className="px-4 py-3">{x.alasan}</td>
                  <td className="px-4 py-3 font-medium">{rp(x.total)}</td>
                </tr>
              ))}
              {!riwayat.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Belum ada retur.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {sel && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setSel(null)}>
          <div className="max-h-full w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Retur penjualan #{sel.id}</h3>
            {sel.diskon > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Penjualan ini memakai diskon {rp(sel.diskon)}. Uang yang dikembalikan sudah dihitung proporsional.</p>}
            <div className="space-y-2">
              {sel.items.map((i) => {
                const maks = i.qty - sudah(sel, i.id);
                return (
                  <div key={i.id} className="grid items-center gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-5">
                    <div className="sm:col-span-2">
                      <p className="font-medium">{i.obat.nama}</p>
                      <p className="text-xs text-slate-400">Batch {i.noBatch} · {rp(i.harga)} · terjual {i.qty}, diretur {i.qty - maks}</p>
                    </div>
                    <input type="number" min="0" max={maks} disabled={maks === 0} className="input" placeholder={`Maks ${maks}`}
                      value={qty[i.id] ?? ''} onChange={(e) => setQty({ ...qty, [i.id]: Math.min(maks, Math.max(0, Number(e.target.value))) || '' })} />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" checked={kembali[i.id] !== false} onChange={(e) => setKembali({ ...kembali, [i.id]: e.target.checked })} />
                      Kembalikan ke stok
                    </label>
                  </div>
                );
              })}
            </div>
            <select className="input" value={alasan} onChange={(e) => setAlasan(e.target.value)}>
              <option value="">Pilih alasan retur...</option>
              {ALASAN.map((a) => <option key={a}>{a}</option>)}
            </select>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Uang dikembalikan: <b className="text-ink">{rp(refund)}</b></p>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setSel(null)}>Batal</button>
                <button className="btn disabled:opacity-50" disabled={!pilih.length} onClick={kirim}>Proses retur</button>
              </div>
            </div>
            <p className="text-xs text-slate-400">Hilangkan centang "Kembalikan ke stok" kalau barangnya rusak atau tidak layak dijual lagi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
