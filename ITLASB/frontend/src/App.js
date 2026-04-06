import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { useToast } from './hooks/useToast';
import Navbar from './components/Shared/Navbar';
import Toast from './components/Shared/Toast';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import CustomerDashboard from './components/Customer/CustomerDashboard';
import CreateWorkPage from './components/Customer/CreateWorkPage';
import AlgorithmPage from './components/Algorithm/AlgorithmPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const { toasts, addToast } = useToast();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role==='admin'?'/admin':'/dashboard'} /> : <LoginPage addToast={addToast} />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard addToast={addToast} /></ProtectedRoute>} />
        <Route path="/algorithm" element={<ProtectedRoute adminOnly><AlgorithmPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard addToast={addToast} /></ProtectedRoute>} />
        <Route path="/create-work" element={<ProtectedRoute><CreateWorkPage addToast={addToast} /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={user ? (user.role==='admin'?'/admin':'/dashboard') : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast toasts={toasts} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
