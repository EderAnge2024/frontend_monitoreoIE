import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import InstitucionesPage from '../modules/dashboard/pages/InstitucionesPage';
import UsuariosPage from '../modules/dashboard/pages/UsuariosPage';
import DocentesPage from '../modules/dashboard/pages/DocentesPage';
import FichasConfigPage from '../modules/dashboard/pages/FichasConfigPage';
import PeriodosPage from '../modules/dashboard/pages/PeriodosPage';
import NuevoMonitoreoPage from '../modules/dashboard/pages/NuevoMonitoreoPage';
import MisMonitoreosPage from '../modules/dashboard/pages/MisMonitoreosPage';
import ReportesPage from '../modules/dashboard/pages/ReportesPage';
import SeguimientoPage from '../modules/dashboard/pages/SeguimientoPage';
import NivelesDesempenoPage from '../modules/dashboard/pages/NivelesDesempenoPage';
import HistorialMonitoreoPage from '../modules/dashboard/pages/HistorialMonitoreoPage';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

import FutsPage from '../modules/dashboard/pages/FutsPage';
import SolicitudesPage from '../modules/dashboard/pages/SolicitudesPage';
import ProfilePage from '../modules/dashboard/pages/ProfilePage';
import GestionDocumentalPage from '../modules/dashboard/pages/GestionDocumentalPage';


const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="fade-in">Cargando aplicación...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Evita que usuarios autenticados accedan a login/forgot-password/reset-password y sufran parpadeos
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="fade-in">Cargando aplicación...</div>
    </div>
  );

  if (user) {
    if (user.role === 'docente') {
      return <Navigate to="/mis-monitoreos" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Admin Modules */}
      <Route path="/instituciones" element={<ProtectedRoute roles={['administrador', 'especialista']}><InstitucionesPage /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute roles={['administrador']}><UsuariosPage /></ProtectedRoute>} />
      <Route path="/periodos" element={<ProtectedRoute roles={['administrador']}><PeriodosPage /></ProtectedRoute>} />
      <Route path="/configuracion-fichas" element={<ProtectedRoute roles={['administrador']}><FichasConfigPage /></ProtectedRoute>} />
      <Route path="/niveles-desempeno" element={<ProtectedRoute roles={['administrador']}><NivelesDesempenoPage /></ProtectedRoute>} />
      <Route path="/futs" element={<ProtectedRoute roles={['administrador', 'director']}><FutsPage /></ProtectedRoute>} />
      
      {/* Shared Modules */}
      <Route path="/docentes" element={<ProtectedRoute roles={['administrador', 'director', 'especialista']}><DocentesPage /></ProtectedRoute>} />
      <Route path="/monitoreo/nuevo" element={<ProtectedRoute roles={['administrador', 'director', 'especialista']}><NuevoMonitoreoPage /></ProtectedRoute>} />
      <Route path="/monitoreo/historial" element={<ProtectedRoute roles={['administrador', 'director', 'especialista']}><HistorialMonitoreoPage /></ProtectedRoute>} />
      <Route path="/reportes" element={<ProtectedRoute roles={['administrador', 'director', 'especialista']}><ReportesPage /></ProtectedRoute>} />
      <Route path="/seguimiento" element={<ProtectedRoute roles={['administrador', 'director', 'especialista', 'docente']}><SeguimientoPage /></ProtectedRoute>} />
      <Route path="/solicitudes" element={<ProtectedRoute roles={['administrador', 'director', 'docente']}><SolicitudesPage /></ProtectedRoute>} />
      <Route path="/gestion-documental" element={<ProtectedRoute roles={['administrador', 'director', 'docente']}><GestionDocumentalPage /></ProtectedRoute>} />
      
      {/* Teacher Modules */}

      <Route path="/mis-monitoreos" element={<ProtectedRoute roles={['docente']}><MisMonitoreosPage /></ProtectedRoute>} />

      {/* Profile */}
      <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default AppRoutes;
