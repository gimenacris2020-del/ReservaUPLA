import { NavLink } from 'react-router-dom';
import {
  Gauge,
  FileCheck2,
  Landmark,
  UserCheck,
  PieChart,
  CalendarClock,
  BookmarkCheck,
  Send,
  KeyRound,
  LogOut,
  X,
  Shield,
  IdCard,
  CheckCircle2,
  MapPin,
  Clock
} from 'lucide-react';
import Popover from '../ui/Popover';
import logoUpla from '../../assets/logo-upla-blanco.png';

export default function Sidebar({
  isOpen,
  onClose,
  currentActor,
  currentUser,
  onLogout
}) {
  // Navegación contextual adaptativa con iconos modernos y diferenciados
  const getNavItemsByRole = (rol) => {
    switch (rol) {
      case 'Administrador':
        return [
          { to: '/panel', label: 'Panel de Control', icon: Gauge },
          { to: '/solicitudes', label: 'Gestión de Solicitudes', icon: FileCheck2 },
          { to: '/espacios', label: 'Catálogo de Espacios', icon: Landmark },
          { to: '/cuentas', label: 'Directorio de Usuarios', icon: UserCheck },
          { to: '/estadisticas', label: 'Métricas e Informes', icon: PieChart, isHighlight: true }
        ];

      case 'Solicitante':
        return [
          { to: '/calendario', label: 'Agenda y Disponibilidad', icon: CalendarClock, isHighlight: true },
          { to: '/mis-solicitudes', label: 'Mis Solicitudes', icon: BookmarkCheck },
          { to: '/solicitar-espacio', label: 'Registrar Solicitud', icon: Send }
        ];

      case 'Responsable de ambiente':
        return [
          { to: '/calendario', label: 'Agenda de Ocupación', icon: CalendarClock, isHighlight: true },
          { to: '/espacios', label: 'Ambientes Asignados', icon: KeyRound },
          { to: '/solicitudes', label: 'Solicitudes y Reportes', icon: FileCheck2 }
        ];

      default:
        return [
          { to: '/calendario', label: 'Agenda Institucional', icon: CalendarClock },
          { to: '/solicitudes', label: 'Solicitudes', icon: FileCheck2 }
        ];
    }
  };

  const navItems = getNavItemsByRole(currentActor);
  const displayRole = currentActor === 'Solicitante' ? 'Docente' : currentActor;

  return (
    <>
      {/* BACKDROP PARA DISPOSITIVOS MÓVILES */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* CONTENEDOR DEL SIDEBAR: AZUL ENTERO Y LETRAS BLANCAS */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#003366] border-r border-blue-900/60 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* CABECERA INSTITUCIONAL: LOGO UPLA Y MARCA (AZUL ENTERO Y LETRAS BLANCAS) */}
        <div>
          <div className="h-18 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#002244]/60">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/10 p-1.5 flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                <img src={logoUpla} alt="Escudo UPLA" className="h-full w-auto object-contain" />
              </div>
              <div className="truncate">
                <span className="text-base font-black text-white tracking-tight block">
                  ReservaUPLA
                </span>
                <p className="text-[10px] text-blue-200 font-medium truncate m-0">
                  Oficina de Informática y Sistemas
                </p>
              </div>
            </div>

            {/* Botón Cerrar en móvil */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="Cerrar menú lateral"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* NAVEGACIÓN PRINCIPAL: ESTANDARIZADA EN AZUL ENTERO Y LETRAS BLANCAS */}
          <div className="px-3 py-5 space-y-4">
            <div className="px-3">
              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block">
                Módulos del {displayRole}
              </span>
            </div>

            <nav className="w-full space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold min-h-[42px] transition-all cursor-pointer box-border ${
                        isActive
                          ? 'bg-[#002244] text-white shadow-md border border-white/20 font-black'
                          : 'text-white/85 hover:text-white hover:bg-white/10 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon className="h-4 w-4 shrink-0 stroke-[2.2] text-white" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isHighlight && (
                      <span className="text-[9px] font-black uppercase bg-white/20 text-white px-2 py-0.5 rounded border border-white/25 shrink-0 ml-2">
                        Nuevo
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* PIE DE SIDEBAR: FICHA DE SESIÓN CON POPOVER Y CERRAR SESIÓN (SIN SOPORTE TÉCNICO) */}
        <div className="p-3.5 border-t border-white/10 shrink-0 bg-[#002244]/60 space-y-3">
          {currentUser && (
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-white text-[#003366] flex items-center justify-center font-black text-xs shadow-inner shrink-0">
                  {currentUser.nombreCompleto?.charAt(0) || 'U'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-extrabold text-white block truncate leading-tight">
                    {currentUser.nombreCompleto}
                  </span>
                  <span className="text-[10px] font-mono text-blue-200 block font-bold">
                    {currentUser.codigo || 'DOC-UPLA'}
                  </span>
                </div>
              </div>

              {/* POPOVER CON DETALLES DE SESIÓN INSTITUCIONAL */}
              <Popover
                title="Ficha de Sesión Activa"
                side="right"
                align="end"
                className="bg-[#002244] text-white border border-blue-900"
                trigger={
                  <div
                    className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Ver detalles de la sesión"
                  >
                    <IdCard className="h-4 w-4" />
                  </div>
                }
              >
                <div className="space-y-2.5 pt-1 text-white">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Shield className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                    <span className="text-blue-200">Rol:</span>
                    <span className="font-bold text-white">{displayRole}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-blue-200">Estado:</span>
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activo en Intranet
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                    <span className="text-blue-200">Campus:</span>
                    <span className="font-semibold text-white">Huancayo - Chorrillos</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                    <span className="text-blue-200">Semestre:</span>
                    <span className="font-mono font-bold text-white">2026-I</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[10px] text-blue-200 leading-tight">
                    Credencial institucional verificada para reserva y control de aulas.
                  </div>
                </div>
              </Popover>
            </div>
          )}

          {/* BOTÓN CERRAR SESIÓN */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-rose-600/85 hover:bg-rose-600 active:bg-rose-700 border border-rose-400/30 shadow-sm transition-all duration-150 cursor-pointer min-h-[38px]"
            aria-label="Cerrar sesión institucional"
          >
            <LogOut className="h-4 w-4 stroke-[2.2]" />
            <span>Cerrar Sesión</span>
          </button>

          {/* CRÉDITOS Y MARCA INSTITUCIONAL */}
          <div className="pt-0.5 text-center">
            <span className="text-[10px] font-bold text-white/80 block">
              Universidad Peruana Los Andes
            </span>
            <span className="text-[9px] text-blue-200/70 block font-medium">
              Módulo Institucional ReservaUPLA
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
