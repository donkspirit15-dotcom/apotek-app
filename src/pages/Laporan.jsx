import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const tgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const lokal = (d) => d.toLocaleDateString('en-CA');
const geser = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return lokal(d); };

const WARNA = ['#0f766e', '#d97706', '#6366f1', '#94a3b8'];
const pendek = (t) => new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
const ringkas = (n) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)} jt` : n >= 1e3 ? `${Math.round(n / 1e3)} rb` : n);

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const hari = new Date(label + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-ink">{hari}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.stroke }}>{p.name}: {rp(p.value)}</p>)}
      <p className="mt-1 text-xs text-slate-500">{payload[0].payload.transaksi} transaksi</p>
    </div>
  );
}


export default function Laporan() {
  const [dari, setDari] = useState(() => lokal(new Date()).slice(0, 8) + '01');
  const [sampai, setSampai] = useState(() => lokal(new Date()));
  const [data, setData] = useState(null);
  const [stok, setStok] = useState(null);

  useEffect(() => {
    api.list(`laporan/penjualan?dari=${dari}&sampai=${sampai}`).then(setData).catch(() => {});
  }, [dari, sampai]);
  useEffect(() => { api.list('laporan/stok').then(setStok).catch(() => {}); }, []);

  const set = (a, b) => { setDari(a); setSampai(b); };
  const unduh = () => {
    const baris = ['Tanggal,Transaksi,Omzet,Laba kotor', ...data.harian.map((h) => `${h.tanggal},${h.transaksi},${h.omzet},${h.laba}`)];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([baris.join('\n')], { type: 'text/csv' }));
    a.download = `penjualan-${dari}_${sampai}.csv`;
    a.click();
  };

  const r = data?.ringkasan;
  const metodeData = data ? Object.entries(data.metode).map(([name, value]) => ({ name, value })) : [];
  const kecil = data && data.harian.length <= 31 ? { r: 3 } : false;
  const cards = r ? [
    ['Omzet (bersih)', rp(r.omzet)], ['Laba kotor', rp(r.laba)], ['Transaksi', r.transaksi],
    ['Item terjual', r.item], ['Diskon diberikan', rp(r.diskon)], ['Retur', rp(r.retur)],
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">Laporan</h2>
        <button className="btn-ghost" onClick={() => set(geser(0), geser(0))}>Hari ini</button>
        <button className="btn-ghost" onClick={() => set(geser(-6), geser(0))}>7 hari</button>
        <button className="btn-ghost" onClick={() => set(lokal(new Date()).slice(0, 8) + '01', geser(0))}>Bulan ini</button>
        <input type="date" className="input !w-40" value={dari} max={sampai} onChange={(e) => setDari(e.target.value)} />
        <span className="text-slate-400">s/d</span>
        <input type="date" className="input !w-40" value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} />
      </div>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(([l, v]) => (
              <div key={l} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">{l}</p>
                <p className="mt-1 text-2xl font-bold text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-ink">Omzet dan laba kotor per hari</h3>
                <button className="btn-ghost" onClick={unduh}>Unduh CSV</button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.harian} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gOmzet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="tanggal" tickFormatter={pendek} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tickFormatter={ringkas} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip content={<Tip />} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="omzet" name="Omzet" stroke="#0f766e" strokeWidth={2.5} fill="url(#gOmzet)" dot={kecil} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="laba" name="Laba kotor" stroke="#d97706" strokeWidth={2} fill="none" dot={kecil} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-2 font-bold text-ink">Metode pembayaran</h3>
              {metodeData.length ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={metodeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {metodeData.map((m, i) => <Cell key={m.name} fill={WARNA[i % WARNA.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => rp(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {metodeData.map((m, i) => (
                      <li key={m.name} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: WARNA[i % WARNA.length] }} />
                        {m.name}<span className="ml-auto font-medium">{rp(m.value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p className="text-sm text-slate-400">Belum ada penjualan di rentang ini.</p>}
            </section>
          </div>

          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <h3 className="p-5 pb-3 font-bold text-ink">Obat terlaris</h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{['Kode', 'Nama obat', 'Terjual', 'Omzet'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.terlaris.map((o) => (
                  <tr key={o.kode} className="border-t border-slate-100">
                    <td className="px-4 py-3">{o.kode}</td><td className="px-4 py-3">{o.nama}</td>
                    <td className="px-4 py-3">{o.qty}</td><td className="px-4 py-3">{rp(o.omzet)}</td>
                  </tr>
                ))}
                {!data.terlaris.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada penjualan di rentang ini.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}

      {stok && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-ink">Kondisi stok saat ini</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Nilai persediaan (harga beli)</p>
              <p className="mt-1 text-2xl font-bold text-ink">{rp(stok.nilai)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Jenis obat terdaftar</p>
              <p className="mt-1 text-2xl font-bold text-ink">{stok.jenis}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="mb-2 font-semibold">Hampir / sudah expired (≤ 90 hari)</h4>
              {stok.kadaluarsa.map((b, i) => (
                <p key={i} className="border-t border-slate-100 py-2 text-sm">
                  {b.obat} · batch {b.noBatch} · sisa {b.qty} ·{' '}
                  <span className={b.sisa_hari < 0 ? 'font-semibold text-red-600' : 'text-amber-600'}>
                    {b.sisa_hari < 0 ? 'expired' : `${b.sisa_hari} hari lagi`} ({tgl(b.expired)})
                  </span>
                </p>
              ))}
              {!stok.kadaluarsa.length && <p className="text-sm text-slate-400">Tidak ada.</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="mb-2 font-semibold">Stok menipis</h4>
              {stok.menipis.map((o) => (
                <p key={o.kode} className="border-t border-slate-100 py-2 text-sm">
                  {o.nama} · stok <b>{o.stok}</b> (min. {o.stok_min})
                </p>
              ))}
              {!stok.menipis.length && <p className="text-sm text-slate-400">Tidak ada.</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
