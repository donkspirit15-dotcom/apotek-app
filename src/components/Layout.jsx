import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

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
];
const soon = ['Stok opname'];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen md:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-ink p-5 text-white transition-transform md:static md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <h1 className="mb-8 text-xl font-bold tracking-tight">Apotek</h1>
        <nav className="space-y-1 text-sm" onClick={() => setOpen(false)}>
          {menu.filter((m) => !m.owner || user.role !== 'kasir').map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `block rounded-lg px-3 py-2 ${isActive ? 'bg-brand font-semibold' : 'text-teal-50/80 hover:bg-white/10'}`}>
              {m.label}
            </NavLink>
          ))}
          <p className="px-3 pb-1 pt-6 text-xs text-teal-200/60">Segera hadir</p>
          {soon.map((s) => <span key={s} className="block px-3 py-2 text-teal-100/40">{s}</span>)}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button className="text-2xl md:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}>☰</button>
          <span className="ml-auto text-sm text-slate-600">{user.nama} · {user.role}</span>
          <button onClick={logout} className="btn-ghost">Keluar</button>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
