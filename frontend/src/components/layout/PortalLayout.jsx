import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ModalConfirmacion from '../ui/ModalConfirmacion';

export default function PortalLayout() {
  const { currentUser, currentActor, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/acceso', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentActor={currentActor}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* ÁREA DERECHA: NAVBAR SUPERIOR + CONTENIDO PRINCIPAL + FOOTER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* NAVBAR SUPERIOR: ÚNICAMENTE BREADCRUMB */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentActor={currentActor}
        />

        {/* CONTENIDO PRINCIPAL DE LA PÁGINA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* FOOTER INSTITUCIONAL */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#003366] shrink-0" />
              <span className="font-semibold text-slate-700">
                Universidad Peruana Los Andes — Oficina de Informática y Sistemas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#003366] shrink-0" />
              <span>ReservaUPLA • Gestión Integral de Espacios y Aulas</span>
            </div>
          </div>
        </footer>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      <ModalConfirmacion
        isOpen={showLogoutModal}
        title="Cerrar Sesión Institucional"
        message="¿Estás seguro de que deseas salir de ReservaUPLA? Para volver a ingresar deberás identificarte con tu código institucional."
        confirmText="Sí, cerrar sesión"
        cancelText="Permanecer conectado"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
