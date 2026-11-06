import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { user, login } = useAuth();
  const [f, setF] = useState({ u: '', p: '' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (!(await login(f.u.trim(), f.p))) setErr('Username atau password salah. Coba lagi.');
  };
  return (
    <div className="grid min-h-screen place-items-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-ink">Masuk ke Apotek</h1>
          <p className="text-sm text-slate-500">Gunakan akun yang diberikan owner.</p>
        </div>
        <label className="block text-sm font-medium">Username
          <input className="input mt-1" value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })} autoFocus required />
        </label>
        <label className="block text-sm font-medium">Password
          <input type="password" className="input mt-1" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} required />
        </label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full">Masuk</button>
      </form>
    </div>
  );
}
