import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentActor } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/acceso" state={{ from: location }} replace />;
  }

  // Validación de autorización según el Rol Institucional
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentActor)) {
    const fallbackPath =
      currentActor === 'Administrador'
        ? '/panel'
        : currentActor === 'Responsable de ambiente'
        ? '/calendario'
        : '/mis-solicitudes';
    return <Navigate to={fallbackPath} replace />;
  }

  return children ? children : <Outlet />;
}
