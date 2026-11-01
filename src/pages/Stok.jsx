import { Fragment, useEffect, useState } from 'react';
import { api } from '../api';

const tgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const pill = 'rounded-full px-2 py-0.5 text-xs font-semibold ';

function Status({ r }) {
  if (r.sisa_hari !== null && r.sisa_hari < 0) return <span className={pill + 'bg-red-100 text-red-700'}>Ada yang expired</span>;
  if (r.sisa_hari !== null && r.sisa_hari <= 90) return <span className={pill + 'bg-amber-100 text-amber-700'}>Hampir expired</span>;
  if (r.menipis) return <span className={pill + 'bg-amber-100 text-amber-700'}>Stok menipis</span>;
  return <span className={pill + 'bg-teal-100 text-teal-700'}>Aman</span>;
}

export default function Stok() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  useEffect(() => { api.list('stok').then(setRows); }, []);
  const shown = rows.filter((r) => (r.kode + r.nama).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">Stok obat</h2>
        <input className="input !w-56" placeholder="Cari kode atau nama..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{['Kode', 'Nama obat', 'Stok', 'Stok min.', 'Expired terdekat', 'Status'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <Fragment key={r.id}>
                <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <td className="px-4 py-3">{r.kode}</td>
                  <td className="px-4 py-3 font-medium">{r.nama}</td>
                  <td className="px-4 py-3">{r.stok} {r.satuan}</td>
                  <td className="px-4 py-3">{r.stok_min}</td>
                  <td className="px-4 py-3">{r.expired_terdekat ? tgl(r.expired_terdekat) : '-'}</td>
                  <td className="px-4 py-3"><Status r={r} /></td>
                </tr>
                {open === r.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-3">
                      {r.batches.length ? r.batches.map((b) => (
                        <p key={b.id} className="text-xs text-slate-600">Batch {b.noBatch} · expired {tgl(b.expired)} · sisa {b.qty}</p>
                      )) : <p className="text-xs text-slate-400">Belum ada stok. Input lewat menu Pembelian.</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!shown.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Tidak ada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
