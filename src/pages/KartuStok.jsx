import { useEffect, useState } from 'react';
import { api } from '../api';

const lokal = (d) => d.toLocaleDateString('en-CA');
const geser = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return lokal(d); };
const JENIS = {
  MASUK: ['Pembelian', 'bg-teal-100 text-teal-700'], JUAL: ['Penjualan', 'bg-slate-100 text-slate-600'],
  RETUR: ['Retur', 'bg-indigo-100 text-indigo-700'], OPNAME: ['Opname', 'bg-amber-100 text-amber-700'],
  BATAL: ['Batal pembelian', 'bg-red-100 text-red-700'],
};

export default function KartuStok() {
  const [obat, setObat] = useState([]);
  const [id, setId] = useState('');
  const [dari, setDari] = useState(geser(-29));
  const [sampai, setSampai] = useState(geser(0));
  const [data, setData] = useState(null);

  useEffect(() => { api.list('obat').then(setObat); }, []);
  useEffect(() => {
    if (!id) return setData(null);
    api.list(`kartu?obatId=${id}&dari=${dari}&sampai=${sampai}`).then(setData).catch(() => {});
  }, [id, dari, sampai]);

  const cards = data ? [['Saldo awal', data.saldoAwal], ['Masuk', data.masuk], ['Keluar', data.keluar], ['Saldo akhir', data.saldoAkhir]] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">Kartu stok</h2>
        <select className="input !w-64" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Pilih obat...</option>
          {obat.map((o) => <option key={o.id} value={o.id}>{o.kode} · {o.nama}</option>)}
        </select>
        <input type="date" className="input !w-40" value={dari} max={sampai} onChange={(e) => setDari(e.target.value)} />
        <span className="text-slate-400">s/d</span>
        <input type="date" className="input !w-40" value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} />
      </div>

      {!data && <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">Pilih obat untuk melihat riwayat pergerakan stoknya.</p>}

      {data && (
        <>
          {!data.cek.cocok && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Perhatian: total catatan pergerakan ({data.cek.catatan}) tidak sama dengan stok di batch ({data.cek.stok}). Lakukan stok opname untuk obat ini.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([l, v]) => (
              <div key={l} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{l} ({data.obat.satuan})</p>
                <p className="mt-1 text-2xl font-bold text-ink">{v}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{['Waktu', 'Jenis', 'Batch', 'Masuk', 'Keluar', 'Saldo', 'Keterangan'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((m) => {
                  const [nama, warna] = JENIS[m.tipe] ?? [m.tipe, 'bg-slate-100 text-slate-600'];
                  return (
                    <tr key={m.id} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-4 py-3">{new Date(m.waktu).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${warna}`}>{nama}</span></td>
                      <td className="px-4 py-3">{m.noBatch}</td>
                      <td className="px-4 py-3 text-teal-700">{m.qty > 0 ? `+${m.qty}` : ''}</td>
                      <td className="px-4 py-3 text-red-600">{m.qty < 0 ? m.qty : ''}</td>
                      <td className="px-4 py-3 font-semibold">{m.saldo}</td>
                      <td className="px-4 py-3 text-slate-500">{m.ket}</td>
                    </tr>
                  );
                })}
                {!data.rows.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Tidak ada pergerakan stok di rentang ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
