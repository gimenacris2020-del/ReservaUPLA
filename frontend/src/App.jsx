import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { PortalLayout } from './components/layout';
import {
  AccesoPage,
  PanelControlPage,
  CalendarioPage,
  SolicitudesPage,
  MisSolicitudesPage,
  EspaciosPage,
  CuentasUsuariosPage,
  EstadisticasPage,
  RegistrarSolicitudPage,
  NoEncontradoPage
} from './pages';

export default function App() {
  return (
    <Routes>
      {/* RUTA PÚBLICA DE ACCESO INSTITUCIONAL */}
      <Route path="/acceso" element={<AccesoPage />} />
      <Route path="/login" element={<Navigate to="/acceso" replace />} />

      {/* RUTAS PROTEGIDAS DENTRO DEL PORTAL INSTITUCIONAL */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/panel" replace />} />
        
        {/* Panel de Control Principal */}
        <Route path="panel" element={<PanelControlPage />} />
        <Route path="dashboard" element={<Navigate to="/panel" replace />} />
        <Route path="inicio" element={<Navigate to="/panel" replace />} />

        {/* Calendario de Ocupación */}
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="agenda" element={<Navigate to="/calendario" replace />} />
        <Route path="disponibilidad" element={<Navigate to="/calendario" replace />} />

        {/* Gestión de Solicitudes (Administrador y Responsable de ambiente) */}
        <Route
          path="solicitudes"
          element={
            <ProtectedRoute allowedRoles={['Administrador', 'Responsable de ambiente']}>
              <SolicitudesPage />
            </ProtectedRoute>
          }
        />
        <Route path="reservas" element={<Navigate to="/solicitudes" replace />} />
        <Route path="reservations" element={<Navigate to="/solicitudes" replace />} />

        {/* Mis Solicitudes (Docente / Solicitante) */}
        <Route
          path="mis-solicitudes"
          element={
            <ProtectedRoute allowedRoles={['Solicitante']}>
              <MisSolicitudesPage />
            </ProtectedRoute>
          }
        />
        <Route path="mis-reservas" element={<Navigate to="/mis-solicitudes" replace />} />
        <Route path="my-reservations" element={<Navigate to="/mis-solicitudes" replace />} />

        {/* Espacios Universitarios (Administrador y Responsable de ambiente) */}
        <Route
          path="espacios"
          element={
            <ProtectedRoute allowedRoles={['Administrador', 'Responsable de ambiente']}>
              <EspaciosPage />
            </ProtectedRoute>
          }
        />
        <Route path="ambientes" element={<Navigate to="/espacios" replace />} />
        <Route path="rooms" element={<Navigate to="/espacios" replace />} />

        {/* Cuentas de Usuarios (Exclusivo Administrador) */}
        <Route
          path="cuentas"
          element={
            <ProtectedRoute allowedRoles={['Administrador']}>
              <CuentasUsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route path="usuarios" element={<Navigate to="/cuentas" replace />} />
        <Route path="users" element={<Navigate to="/cuentas" replace />} />

        {/* Métricas e Informes de Ocupación (Exclusivo Administrador) */}
        <Route
          path="estadisticas"
          element={
            <ProtectedRoute allowedRoles={['Administrador']}>
              <EstadisticasPage />
            </ProtectedRoute>
          }
        />
        <Route path="reportes" element={<Navigate to="/estadisticas" replace />} />
        <Route path="reports" element={<Navigate to="/estadisticas" replace />} />

        {/* Registrar Nueva Solicitud (Docente y Administrador) */}
        <Route
          path="solicitar-espacio"
          element={
            <ProtectedRoute allowedRoles={['Solicitante', 'Administrador']}>
              <RegistrarSolicitudPage />
            </ProtectedRoute>
          }
        />
        <Route path="nueva-reserva" element={<Navigate to="/solicitar-espacio" replace />} />
        <Route path="create-reservation" element={<Navigate to="/solicitar-espacio" replace />} />

        {/* Ruta no encontrada dentro del layout */}
        <Route path="*" element={<NoEncontradoPage />} />
      </Route>

      {/* Fallback general */}
      <Route path="*" element={<Navigate to="/calendario" replace />} />
    </Routes>
  );
}
