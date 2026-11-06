import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { jumlahAntrian, syncQueue } from '../offline';
import GantiPassword from './GantiPassword';

const menu = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/obat', label: 'Data obat' },
  { to: '/kategori', label: 'Kategori' },
  { to: '/supplier', label: 'Supplier' },
  { to: '/pembelian', label: 'Pembelian' },
  { to: '/stok', label: 'Stok obat' },
  { to: '/kasir', label: 'Kasir' },
  { to: '/penjualan', label: 'Riwayat penjualan' },
  { to: '/laporan', label: 'Laporan', owner: true },
  { to: '/opname', label: 'Stok opname', owner: true },
  { to: '/retur', label: 'Retur penjualan', owner: true },
  { to: '/kartu', label: 'Kartu stok', owner: true },
  { to: '/users', label: 'Pengguna', owner: true, admin: true },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const [pw, setPw] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [antri, setAntri] = useState(jumlahAntrian());
  const [pasang, setPasang] = useState(null);
  useEffect(() => {
    const upd = () => setAntri(jumlahAntrian());
    const on = () => { setOnline(true); syncQueue(); };
    const off = () => setOnline(false);
    const prompt = (e) => { e.preventDefault(); setPasang(e); };
    window.addEventListener('antrian', upd);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('beforeinstallprompt', prompt);
    if (navigator.onLine) syncQueue();
    return () => {
      window.removeEventListener('antrian', upd);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', prompt);
    };
  }, []);
  return (
    <div className="min-h-screen md:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-ink p-5 text-white transition-transform md:static md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <h1 className="mb-8 text-xl font-bold tracking-tight">Apotek</h1>
        <nav className="space-y-1 text-sm" onClick={() => setOpen(false)}>
          {menu.filter((m) => (!m.owner || user.role !== 'kasir') && (!m.admin || user.role === 'owner')).map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `block rounded-lg px-3 py-2 ${isActive ? 'bg-brand font-semibold' : 'text-teal-50/80 hover:bg-white/10'}`}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button className="text-2xl md:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}>☰</button>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {!online && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Offline</span>}
            {antri > 0 && (
              <button className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800" onClick={() => syncQueue()}>
                {antri} penjualan belum sinkron
              </button>
            )}
            {pasang && (
              <button className="btn-ghost" onClick={async () => { pasang.prompt(); await pasang.userChoice; setPasang(null); }}>Pasang aplikasi</button>
            )}
            <span className="text-sm text-slate-600">{user.nama} · {user.role}</span>
          </div>
          <button onClick={() => setPw(true)} className="btn-ghost">Ganti password</button>
          <button onClick={logout} className="btn-ghost">Keluar</button>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
        {pw && <GantiPassword onClose={() => setPw(false)} />}
      </div>
    </div>
  );
}
