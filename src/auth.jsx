import { createContext, useContext, useState } from 'react';
import { api } from './api';

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('apotek:user')); } catch { return null; }
  });
  const login = async (u, p) => {
    try {
      const { token, user } = await api.login(u, p);
      localStorage.setItem('apotek:token', token);
      localStorage.setItem('apotek:user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch { return false; }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('apotek:token');
    localStorage.removeItem('apotek:user');
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
