import { useEffect, useState } from 'react';
import { api } from '../api';

const ROLE = { owner: 'Owner', apoteker: 'Apoteker', kasir: 'Kasir' };
const kosong = () => ({ username: '', nama: '', role: 'kasir', aktif: true, password: '' });

export default function Users() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const load = async () => setRows(await api.list('users'));
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.save('users', form.id
        ? { id: form.id, nama: form.nama, role: form.role, aktif: form.aktif, password: form.password }
        : { username: form.username, nama: form.nama, role: form.role, password: form.password });
      setForm(null);
      load();
    } catch { /* pesan error sudah ditampilkan oleh api.js */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">Pengguna</h2>
        <button className="btn" onClick={() => setForm(kosong())}>Tambah pengguna</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{['Username', 'Nama', 'Peran', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={`border-t border-slate-100 ${u.aktif ? '' : 'text-slate-400'}`}>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.nama}</td>
                <td className="px-4 py-3">{ROLE[u.role]}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.aktif ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{u.aktif ? 'Aktif' : 'Nonaktif'}</span>
                </td>
                <td className="px-4 py-3 text-right"><button className="btn-ghost" onClick={() => setForm({ ...u, password: '' })}>Ubah</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-ink">{form.id ? `Ubah ${form.username}` : 'Tambah pengguna'}</h3>
            {!form.id && (
              <label className="block text-sm font-medium">Username
                <input className="input mt-1" value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="mis. kasir2" required />
              </label>
            )}
            <label className="block text-sm font-medium">Nama
              <input className="input mt-1" value={form.nama} onChange={(e) => set('nama', e.target.value)} required />
            </label>
            <label className="block text-sm font-medium">Peran
              <select className="input mt-1" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">{form.id ? 'Reset password (opsional)' : 'Password'}
              <input type="password" className="input mt-1" minLength={form.id && !form.password ? undefined : 8} value={form.password}
                onChange={(e) => set('password', e.target.value)} required={!form.id} placeholder={form.id ? 'Kosongkan jika tidak diganti' : 'Minimal 8 karakter'} />
            </label>
            {form.id && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.aktif} onChange={(e) => set('aktif', e.target.checked)} />
                Akun aktif (hilangkan centang untuk menonaktifkan)
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Batal</button>
              <button className="btn">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
