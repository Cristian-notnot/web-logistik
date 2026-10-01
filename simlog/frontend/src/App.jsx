import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InventarisList from './pages/Inventaris/InventarisList';
import OperasionalModule from './pages/OperasionalModule';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import HomepageManager from './pages/HomepageManager';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/kelola-beranda" element={<ProtectedRoute><AdminRoute><HomepageManager /></AdminRoute></ProtectedRoute>} />
      <Route path="/inventaris" element={<ProtectedRoute><InventarisList /></ProtectedRoute>} />
      <Route path="/unboxing" element={<ProtectedRoute><OperasionalModule type="unboxing" /></ProtectedRoute>} />
      <Route path="/piket" element={<ProtectedRoute><OperasionalModule type="piket" /></ProtectedRoute>} />
      <Route path="/sewa" element={<ProtectedRoute><OperasionalModule type="sewa" /></ProtectedRoute>} />
      <Route path="/pengadaan" element={<ProtectedRoute><OperasionalModule type="pengadaan" /></ProtectedRoute>} />
      <Route path="/revitalisasi" element={<ProtectedRoute><OperasionalModule type="revitalisasi" /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/laporan" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

      {/* Rute modul fase berikutnya akan ditambahkan di sini:
          /unboxing, /piket, /sewa, /pengadaan, /revitalisasi, /laporan */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
