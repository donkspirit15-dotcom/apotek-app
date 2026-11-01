import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [s, setS] = useState({ obat: 0, menipis: 0, hampir_expired: 0, expired: 0 });
  useEffect(() => {
    (async () => {
      const [o, r] = await Promise.all([api.list('obat'), api.list('stok/ringkasan')]);
      setS({ obat: o.length, ...r });
    })();
  }, []);
  const cards = [
    ['Jenis obat', s.obat, ''],
    ['Stok menipis', s.menipis, s.menipis ? 'text-amber-600' : ''],
    ['Hampir expired (90 hari)', s.hampir_expired, s.hampir_expired ? 'text-amber-600' : ''],
    ['Sudah expired', s.expired, s.expired ? 'text-red-600' : ''],
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, val, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color || 'text-ink'}`}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
