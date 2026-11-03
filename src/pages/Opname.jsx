import { Fragment, useEffect, useState } from 'react';
import { api } from '../api';

const rp = (n) => (n < 0 ? '−' : '') + 'Rp ' + Math.abs(n).toLocaleString('id-ID');
const tgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const ALASAN = ['Salah hitung / salah input', 'Hilang', 'Rusak', 'Dibuang (expired)', 'Lainnya'];

export default function Opname() {
  const [rows, setRows] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [q, setQ] = useState('');
  const [fisik, setFisik] = useState({});
  const [alasan, setAlasan] = useState({});
  const [catatan, setCatatan] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [stok, rw] = await Promise.all([api.list('stok'), api.list('opname')]);
    setRows(stok.flatMap((s) => s.batches.map((b) => ({
      batchId: b.id, kode: s.kode, nama: s.nama, satuan: s.satuan, noBatch: b.noBatch, expired: b.expired, sistem: b.qty,
    }))));
    setRiwayat(rw);
  };
  useEffect(() => { load(); }, []);

  const beda = (r) => (fisik[r.batchId] === undefined || fisik[r.batchId] === '' ? 0 : Number(fisik[r.batchId]) - r.sistem);
  const berubah = rows.filter((r) => beda(r) !== 0);
  const shown = rows.filter((r) => (r.kode + r.nama + r.noBatch).toLowerCase().includes(q.toLowerCase()));

  const simpan = async () => {
    if (berubah.some((r) => !alasan[r.batchId])) return alert('Pilih alasan untuk setiap baris yang ada selisihnya.');
    if (!confirm(`Simpan opname? Stok sistem untuk ${berubah.length} batch akan disesuaikan dengan hitungan fisik.`)) return;
    setBusy(true);
    try {
      await api.save('opname', {
        catatan,
        items: berubah.map((r) => ({ batchId: r.batchId, qtySistem: r.sistem, qtyFisik: Number(fisik[r.batchId]), ket: alasan[r.batchId] })),
      });
      setFisik({}); setAlasan({}); setCatatan('');
      await load();
    } catch { /* pesan error sudah ditampilkan oleh api.js */ } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-2xl font-bold text-ink">Stok opname</h2>
          <input className="input !w-64" placeholder="Cari obat atau batch..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <p className="text-sm text-slate-500">Isi kolom <b>Fisik</b> dengan jumlah hasil hitung di rak. Kosongkan kalau tidak dihitung. Hanya baris yang ada selisihnya yang disimpan.</p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{['Obat', 'Batch', 'Expired', 'Sistem', 'Fisik', 'Selisih', 'Alasan'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const s = beda(r);
                return (
                  <tr key={r.batchId} className="border-t border-slate-100">
                    <td className="px-4 py-3"><p className="font-medium">{r.nama}</p><p className="text-xs text-slate-400">{r.kode}</p></td>
                    <td className="px-4 py-3">{r.noBatch}</td>
                    <td className="px-4 py-3">{tgl(r.expired)}</td>
                    <td className="px-4 py-3">{r.sistem} {r.satuan}</td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" className="input !w-24" value={fisik[r.batchId] ?? ''}
                        onChange={(e) => setFisik({ ...fisik, [r.batchId]: e.target.value })} />
                    </td>
                    <td className={`px-4 py-3 font-semibold ${s < 0 ? 'text-red-600' : s > 0 ? 'text-teal-700' : 'text-slate-300'}`}>{s > 0 ? `+${s}` : s}</td>
                    <td className="px-4 py-3">
                      {s !== 0 && (
                        <select className="input !w-52" value={alasan[r.batchId] ?? ''} onChange={(e) => setAlasan({ ...alasan, [r.batchId]: e.target.value })}>
                          <option value="">Pilih alasan...</option>
                          {ALASAN.map((a) => <option key={a}>{a}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!shown.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Tidak ada batch dengan stok.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input className="input !w-80" placeholder="Catatan (opsional), mis. opname akhir bulan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          <span className="text-sm text-slate-500">{berubah.length} batch berselisih</span>
          <button className="btn ml-auto disabled:opacity-50" disabled={!berubah.length || busy} onClick={simpan}>{busy ? 'Menyimpan...' : 'Simpan opname'}</button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-ink">Riwayat opname</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{['No.', 'Waktu', 'Petugas', 'Batch', 'Nilai selisih', 'Catatan'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {riwayat.map((o) => (
                <Fragment key={o.id}>
                  <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    <td className="px-4 py-3">#{o.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(o.tanggal).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">{o.petugas}</td>
                    <td className="px-4 py-3">{o.items.length}</td>
                    <td className={`px-4 py-3 font-medium ${o.nilai < 0 ? 'text-red-600' : ''}`}>{rp(o.nilai)}</td>
                    <td className="px-4 py-3 text-slate-500">{o.catatan || '-'}</td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="space-y-1 px-4 py-3 text-xs text-slate-600">
                        {o.items.map((i) => (
                          <p key={i.id}>{i.obat.nama} · batch {i.noBatch}: {i.qtySistem} → {i.qtyFisik} ({i.selisih > 0 ? '+' : ''}{i.selisih}) · {i.ket}</p>
                        ))}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!riwayat.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Belum ada opname.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
