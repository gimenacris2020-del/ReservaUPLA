import { useLocation } from 'react-router-dom';
import { Menu, GraduationCap } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export default function Navbar({ onToggleSidebar, currentActor }) {
  const location = useLocation();

  // Mapeo dinámico de nombres de módulos para el Breadcrumb editorial
  const getBreadcrumbTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/inicio':
      case '/dashboard':
      case '/panel':
        return currentActor === 'Administrador'
          ? 'Panel de Control'
          : currentActor === 'Responsable de ambiente'
          ? 'Agenda de Ocupación'
          : 'Agenda y Solicitud';

      case '/agenda':
      case '/calendario':
      case '/disponibilidad':
        return currentActor === 'Responsable de ambiente'
          ? 'Agenda de Ocupación'
          : 'Agenda y Disponibilidad';

      case '/reservas':
      case '/solicitudes':
      case '/reservations':
        return currentActor === 'Administrador'
          ? 'Gestión de Solicitudes'
          : currentActor === 'Responsable de ambiente'
          ? 'Solicitudes y Reportes'
          : 'Solicitudes';

      case '/mis-reservas':
      case '/mis-solicitudes':
      case '/my-reservations':
        return 'Mis Solicitudes';

      case '/reportes':
      case '/estadisticas':
      case '/reports':
        return 'Métricas e Informes';

      case '/nueva-reserva':
      case '/solicitar-espacio':
      case '/create-reservation':
        return 'Registrar Solicitud';

      case '/ambientes':
      case '/espacios':
      case '/rooms':
        return currentActor === 'Responsable de ambiente'
          ? 'Ambientes Asignados'
          : 'Catálogo de Espacios';

      case '/usuarios':
      case '/cuentas':
      case '/users':
        return 'Directorio de Usuarios';

      default:
        return 'Módulo Institucional';
    }
  };

  const currentSection = getBreadcrumbTitle(location.pathname);
  const displayRole = currentActor === 'Solicitante' ? 'Docente' : currentActor;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      
      {/* LADO IZQUIERDO: TOGGLE MÓVIL Y BREADCRUMB EDITORIAL (SIN ESTILO DE BOTONES) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        {/* Toggle para dispositivos móviles */}
        <Tooltip content="Abrir menú de navegación" side="bottom">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Abrir menú lateral"
          >
            <Menu className="h-5 w-5 stroke-[2.2]" />
          </button>
        </Tooltip>

        {/* BREADCRUMB TIPOGRÁFICO EDITORIAL (SIN PÍLDORAS NI BORDES TIPO BOTÓN) */}
        <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-xs min-w-0">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold shrink-0">
            <GraduationCap className="h-4 w-4 text-[#003366]" />
            <span className="hidden sm:inline">UPLA</span>
          </div>

          <span className="text-slate-300 font-light select-none">/</span>

          <span className="text-slate-500 font-semibold tracking-wide uppercase shrink-0">
            {displayRole}
          </span>

          <span className="text-slate-300 font-light select-none">/</span>

          <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate leading-none m-0">
            {currentSection}
          </h1>
        </nav>
      </div>

      {/* LADO DERECHO: INDICADOR INSTITUCIONAL SUTIL Y MINIMALISTA */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Campus Huancayo</span>
        </div>

        <span className="hidden sm:inline text-xs text-slate-400 font-mono font-bold pl-3 border-l border-slate-200">
          2026-I
        </span>
      </div>
    </header>
  );
}
