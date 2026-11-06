import { useState } from 'react';
import { api } from '../api';

export default function GantiPassword({ onClose }) {
  const [f, setF] = useState({ lama: '', baru: '', ulang: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.baru !== f.ulang) return alert('Konfirmasi password baru tidak sama.');
    setBusy(true);
    try {
      await api.save('auth/ganti-password', { passwordLama: f.lama, passwordBaru: f.baru });
      alert('Password berhasil diganti.');
      onClose();
    } catch { /* pesan error sudah ditampilkan oleh api.js */ } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6">
        <h3 className="text-lg font-bold text-ink">Ganti password</h3>
        <label className="block text-sm font-medium">Password lama
          <input type="password" className="input mt-1" value={f.lama} onChange={set('lama')} autoFocus required />
        </label>
        <label className="block text-sm font-medium">Password baru
          <input type="password" className="input mt-1" minLength={8} value={f.baru} onChange={set('baru')} required />
          <span className="text-xs font-normal text-slate-400">Minimal 8 karakter</span>
        </label>
        <label className="block text-sm font-medium">Ulangi password baru
          <input type="password" className="input mt-1" value={f.ulang} onChange={set('ulang')} required />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn disabled:opacity-50" disabled={busy}>Simpan</button>
        </div>
      </form>
    </div>
  );
}
