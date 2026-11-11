import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  ClipboardList,
  LogOut,
  Menu,
  X,
  PhoneCall,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  CheckCircle2
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import logoUpla from '../../assets/logo-upla-blanco.png';

export default function BarraSuperior({
  currentActor,
  currentUser,
  onLogout
}) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Módulos institucionales según el rol del usuario
  const getNavItemsByRole = (rol) => {
    switch (rol) {
      case 'Administrador':
        return [
          { to: '/panel', label: 'Panel de Control', icon: LayoutDashboard },
          { to: '/solicitudes', label: 'Solicitudes y Aprobaciones', icon: ShieldCheck },
          { to: '/espacios', label: 'Catálogo de Espacios', icon: Building2 },
          { to: '/cuentas', label: 'Directorio de Usuarios', icon: Users },
          { to: '/estadisticas', label: 'Métricas de Ocupación', icon: FileSpreadsheet, isHighlight: true }
        ];

      case 'Solicitante':
        return [
          { to: '/calendario', label: 'Agenda y Disponibilidad', icon: CalendarDays, isHighlight: true },
          { to: '/mis-solicitudes', label: 'Mis Solicitudes', icon: ClipboardList },
          { to: '/solicitar-espacio', label: 'Registrar Solicitud', icon: Sparkles }
        ];

      case 'Responsable de ambiente':
        return [
          { to: '/calendario', label: 'Agenda de Ocupación', icon: CalendarDays, isHighlight: true },
          { to: '/espacios', label: 'Espacios Asignados', icon: Building2 },
          { to: '/solicitudes', label: 'Gestión de Solicitudes', icon: ShieldCheck }
        ];

      default:
        return [
          { to: '/calendario', label: 'Calendario', icon: CalendarDays },
          { to: '/solicitudes', label: 'Solicitudes', icon: ShieldCheck }
        ];
    }
  };

  const getBreadcrumbTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/inicio':
      case '/dashboard':
      case '/panel':
        return 'Panel Principal';
      case '/agenda':
      case '/calendario':
      case '/disponibilidad':
        return 'Agenda Institucional';
      case '/reservas':
      case '/solicitudes':
      case '/reservations':
        return 'Gestión de Solicitudes';
      case '/mis-reservas':
      case '/mis-solicitudes':
        return 'Mis Solicitudes';
      case '/reportes':
      case '/estadisticas':
      case '/reports':
        return 'Métricas y Reportes';
      case '/nueva-reserva':
      case '/solicitar-espacio':
      case '/create-reservation':
        return 'Registrar Solicitud';
      case '/ambientes':
      case '/espacios':
      case '/rooms':
        return 'Catálogo de Ambientes';
      case '/usuarios':
      case '/cuentas':
      case '/users':
        return 'Directorio de Usuarios';
      default:
        return 'Módulo Académico';
    }
  };

  const navItems = getNavItemsByRole(currentActor);
  const displayRole = currentActor === 'Solicitante' ? 'Docente' : currentActor;
  const currentSection = getBreadcrumbTitle(location.pathname);

  return (
    <header className="sticky top-0 z-40 shadow-md">
      
      {/* TIER 1: MASTHEAD EJECUTIVO EN AZUL INSTITUCIONAL UPLA (#002b49 a #003366) */}
      <div className="bg-gradient-to-r from-[#002244] via-[#003366] to-[#002855] text-white border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Lado Izquierdo: Escudo UPLA y Título Institucional */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-inner shrink-0 backdrop-blur-xs">
              <img src={logoUpla} alt="Escudo UPLA" className="h-full w-auto object-contain" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-sky-200">
                  UPLA
                </span>
                <span className="text-white/40">•</span>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ReservaUPLA
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium truncate m-0">
                Universidad Peruana Los Andes • Sistema de Gestión de Infraestructura
              </p>
            </div>
          </div>

          {/* Lado Derecho: Rol, Perfil de Usuario y Cerrar Sesión */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* Badge de Rol Institucional */}
            <div className="hidden sm:flex items-center gap-1.5 font-black text-white bg-white/10 border border-white/15 px-3 py-1 rounded-xl text-xs backdrop-blur-xs">
              <Shield className="h-3.5 w-3.5 text-sky-300 shrink-0" />
              <span className="uppercase tracking-wide">{displayRole}</span>
            </div>

            {/* Perfil del Usuario Activo */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-white/15">
                <Tooltip content={`Sesión institucional: ${currentUser.nombreCompleto} (${currentUser.codigo || 'DOC-UPLA'})`} side="bottom">
                  <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-inner ring-2 ring-white/30 shrink-0 cursor-default">
                    {currentUser.nombreCompleto?.charAt(0) || 'U'}
                  </div>
                </Tooltip>

                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-extrabold text-white truncate max-w-[170px] leading-tight">
                    {currentUser.nombreCompleto}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-sky-200 mt-0.5">
                    {currentUser.codigo || 'DOC-UPLA'}
                  </span>
                </div>
              </div>
            )}

            {/* Botón Salir */}
            <Tooltip content="Cerrar sesión institucional" side="bottom">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 border border-rose-400/40 shadow-sm transition-all duration-150 cursor-pointer min-h-[38px]"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4 stroke-[2.4]" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </Tooltip>

            {/* Alternar Menú Móvil */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white hover:text-sky-200 p-2 rounded-xl hover:bg-white/10 cursor-pointer"
              aria-label="Alternar menú de navegación"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6 stroke-[2.2]" />}
            </button>
          </div>
        </div>
      </div>

      {/* TIER 2: SUBNAVEGADOR HORIZONTAL DE MÓDULOS (Enfoque Ejecutivo Top-Nav Gimena) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Pestañas de Navegación Horizontal */}
          <nav className="hidden lg:flex items-center gap-1.5 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.to} content={`Ir a ${item.label}`} side="bottom">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#003366] text-white shadow-md shadow-[#003366]/20 font-extrabold ring-1 ring-[#003366]'
                          : item.isHighlight
                          ? 'text-[#003366] bg-blue-50/80 hover:bg-blue-100 hover:text-blue-900 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 stroke-[2.2]" />
                    <span>{item.label}</span>

                    {item.isHighlight && (
                      <span className="text-[9px] font-black uppercase bg-blue-500/20 text-blue-900 px-1.5 py-0.5 rounded">
                        Nuevo
                      </span>
                    )}
                  </NavLink>
                </Tooltip>
              );
            })}
          </nav>

          {/* Breadcrumb Contextual y Ubicación */}
          <div className="flex items-center gap-2 text-xs py-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Módulo:
            </span>
            <div className="flex items-center gap-1 text-slate-600 font-medium">
              <span className="font-bold text-slate-800">{displayRole}</span>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-extrabold text-[#003366] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {currentSection}
              </span>
            </div>
          </div>

          {/* Soporte Técnico Institucional */}
          <div className="hidden xl:flex items-center gap-2 text-xs py-2">
            <a
              href="https://wa.me/51964256145?text=Hola,%20necesito%20asistencia%20con%20ReservaUPLA"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#003366] font-bold transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-[#003366]" />
              <span>Mesa de Ayuda OIS: 964256145</span>
            </a>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black uppercase text-[#003366]">
              Módulos del {displayRole}
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-bold">
              {currentUser?.codigo}
            </span>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#003366] text-white font-extrabold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.isHighlight && (
                    <span className="text-[9px] font-bold uppercase bg-blue-100 text-[#003366] px-1.5 py-0.5 rounded">
                      Nuevo
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <a
              href="https://wa.me/51964256145"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#003366] font-bold"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>WhatsApp: 964256145</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
