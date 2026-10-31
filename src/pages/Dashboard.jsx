import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [s, setS] = useState({ obat: 0, kategori: 0, supplier: 0, menipis: 0 });
  useEffect(() => {
    (async () => {
      const [o, k, su] = await Promise.all([api.list('obat'), api.list('kategori'), api.list('supplier')]);
      setS({ obat: o.length, kategori: k.length, supplier: su.length, menipis: 0 });
    })();
  }, []);
  const cards = [
    ['Jenis obat', s.obat], ['Kategori', s.kategori], ['Supplier', s.supplier],
    ['Stok menipis', s.menipis, 'Aktif setelah modul stok (minggu 2)'],
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, val, note]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-ink">{val}</p>
            {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
