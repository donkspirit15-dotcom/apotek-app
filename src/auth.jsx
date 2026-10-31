import { createContext, useContext, useState } from 'react';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

// Sementara hardcode. Minggu 1 (backend): ganti dengan POST /auth/login + JWT.
const USERS = [
  { username: 'owner', password: 'owner123', nama: 'Owner', role: 'owner' },
  { username: 'kasir', password: 'kasir123', nama: 'Kasir 1', role: 'kasir' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('apotek:user')); } catch { return null; }
  });
  const login = (u, p) => {
    const found = USERS.find((x) => x.username === u && x.password === p);
    if (!found) return false;
    const { password, ...safe } = found;
    setUser(safe);
    try { localStorage.setItem('apotek:user', JSON.stringify(safe)); } catch {}
    return true;
  };
  const logout = () => { setUser(null); try { localStorage.removeItem('apotek:user'); } catch {} };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
