import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pembelian from './pages/Pembelian';
import Stok from './pages/Stok';
import { Obat, Supplier, Kategori } from './pages/master';

function Guard({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route index element={<Dashboard />} />
            <Route path="obat" element={<Obat />} />
            <Route path="kategori" element={<Kategori />} />
            <Route path="supplier" element={<Supplier />} />
            <Route path="pembelian" element={<Pembelian />} />
            <Route path="stok" element={<Stok />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
