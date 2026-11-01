import { useEffect, useState } from 'react';
import { api } from '../api';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const tgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const blankItem = () => ({ obatId: '', noBatch: '', expired: '', qty: 1, harga: 0 });
const blankForm = () => ({ supplierId: '', tanggal: new Date().toISOString().slice(0, 10), items: [blankItem()] });

export default function Pembelian() {
  const [rows, setRows] = useState([]);
  const [obat, setObat] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(null);

  const load = async () => setRows(await api.list('pembelian'));
  useEffect(() => {
    load();
    api.list('obat').then(setObat);
    api.list('supplier').then(setSuppliers);
  }, []);

  const setItem = (i, patch) => setForm({ ...form, items: form.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) });
  const pickObat = (i, id) => setItem(i, { obatId: id, harga: obat.find((o) => o.id === Number(id))?.harga_beli ?? 0 });
  const total = form ? form.items.reduce((s, i) => s + i.qty * i.harga, 0) : 0;

  const submit = async (e) => {
    e.preventDefault();
    await api.save('pembelian', {
      supplierId: Number(form.supplierId),
      tanggal: form.tanggal,
      items: form.items.map((i) => ({ ...i, obatId: Number(i.obatId), qty: Number(i.qty), harga: Number(i.harga) })),
    });
    setForm(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">Pembelian</h2>
        <button className="btn" onClick={() => setForm(blankForm())}>Pembelian baru</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{['No.', 'Tanggal', 'Supplier', 'Barang', 'Total'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">#{p.id}</td>
                <td className="px-4 py-3">{tgl(p.tanggal)}</td>
                <td className="px-4 py-3">{p.supplier.nama}</td>
                <td className="px-4 py-3 text-slate-600">{p.items.map((i) => `${i.obat.nama} ×${i.qty}`).join(', ')}</td>
                <td className="px-4 py-3 font-medium">{rp(p.total)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Belum ada pembelian.</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-4xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-ink">Pembelian baru</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Supplier
                <select className="input mt-1" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
                  <option value="">Pilih supplier...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Tanggal
                <input type="date" className="input mt-1" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
              </label>
            </div>

            <div className="space-y-3">
              {form.items.map((it, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6">
                  <select className="input sm:col-span-2" value={it.obatId} onChange={(e) => pickObat(i, e.target.value)} required>
                    <option value="">Pilih obat...</option>
                    {obat.map((o) => <option key={o.id} value={o.id}>{o.kode} · {o.nama}</option>)}
                  </select>
                  <input className="input" placeholder="No. batch" value={it.noBatch} onChange={(e) => setItem(i, { noBatch: e.target.value })} required />
                  <input type="date" className="input" title="Tanggal expired" value={it.expired} onChange={(e) => setItem(i, { expired: e.target.value })} required />
                  <input type="number" min="1" className="input" placeholder="Jumlah" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} required />
                  <div className="flex gap-2">
                    <input type="number" min="0" className="input" placeholder="Harga beli" value={it.harga} onChange={(e) => setItem(i, { harga: e.target.value })} required />
                    {form.items.length > 1 && (
                      <button type="button" className="btn-ghost text-red-600" aria-label="Hapus baris" onClick={() => setForm({ ...form, items: form.items.filter((_, n) => n !== i) })}>✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, items: [...form.items, blankItem()] })}>+ Tambah baris</button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Total: <b className="text-ink">{rp(total)}</b></p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Batal</button>
                <button className="btn">Simpan pembelian</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
