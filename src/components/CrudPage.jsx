import { useEffect, useState } from 'react';
import { api } from '../api';

// Halaman CRUD generik: cukup kirim `columns` dan `fields` untuk tiap master data.
export default function CrudPage({ table, title, columns, fields }) {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);

  const load = async () => setRows(await api.list(table));
  useEffect(() => { load(); }, [table]);

  const shown = rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase()));
  const set = (f, v) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(v) : v });
  const submit = async (e) => { e.preventDefault(); await api.save(table, form); setForm(null); load(); };
  const del = async (r) => {
    if (confirm(`Hapus "${r[columns[0].key]}"?`)) { await api.remove(table, r.id); load(); }
  };
  const blank = () => setForm(Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? 0 : ''])));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-2xl font-bold text-ink">{title}</h2>
        <input className="input !w-56" placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={blank}>Tambah {title.toLowerCase()}</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((c) => <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>)}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                {columns.map((c) => <td key={c.key} className="px-4 py-3">{c.format ? c.format(r[c.key]) : r[c.key]}</td>)}
                <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                  <button className="btn-ghost" onClick={() => setForm(r)}>Ubah</button>
                  <button className="btn-ghost text-red-600" onClick={() => del(r)}>Hapus</button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-slate-400">
                Belum ada data. Klik "Tambah {title.toLowerCase()}" untuk mulai.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-ink">{form.id ? 'Ubah' : 'Tambah'} {title.toLowerCase()}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className={`block text-sm font-medium ${f.wide ? 'sm:col-span-2' : ''}`}>{f.label}
                  {f.options ? (
                    <select className="input mt-1" value={form[f.key]} onChange={(e) => set(f, e.target.value)} required>
                      <option value="">Pilih...</option>
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="input mt-1" type={f.type || 'text'} min={f.type === 'number' ? 0 : undefined}
                      value={form[f.key]} onChange={(e) => set(f, e.target.value)} required={f.required !== false} />
                  )}
                </label>
              ))}
            </div>
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
