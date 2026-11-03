import { useEffect, useState } from 'react';
import { api } from '../api';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default function Penjualan() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.list('penjualan').then(setRows); }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-ink">Riwayat penjualan</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{['No.', 'Waktu', 'Kasir', 'Barang', 'Metode', 'Total'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">#{p.id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(p.tanggal).toLocaleString('id-ID')}</td>
                <td className="px-4 py-3">{p.kasir}</td>
                <td className="px-4 py-3 text-slate-600">{p.items.map((i) => `${i.obat.nama} ×${i.qty} (${i.noBatch})`).join(', ')}</td>
                <td className="px-4 py-3">{p.metode}</td>
                <td className="px-4 py-3 font-medium">{rp(p.total)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Belum ada penjualan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
