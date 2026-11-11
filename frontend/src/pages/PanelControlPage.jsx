import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  Building2,
  AlertCircle,
  Check,
  ArrowRight,
  Eye,
  RefreshCw,
  PlusCircle,
  Sparkles,
  Shield,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowUpRight,
  MapPin,
  CalendarDays
} from 'lucide-react';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import { dashboardService, reservationService } from '../service';
import { useAuth } from '../context/AuthContext';

export default function PanelControlPage() {
  const navigate = useNavigate();
  const { currentActor, currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal para aprobar / rechazar desde el panel
  const [modalAccion, setModalAccion] = useState({
    isOpen: false,
    reserva: null,
    accion: '', // 'Aprobada' | 'Rechazada'
    loading: false
  });

  const handleNavigate = (path, params = {}) => {
    const query = params.estado ? `?estado=${encodeURIComponent(params.estado)}` : '';
    navigate(`/${path}${query}`);
  };

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resIndicadores, resPendientes] = await Promise.all([
        dashboardService.getIndicators(),
        reservationService.getAll({ estado: 'Pendiente' })
      ]);
      setData(resIndicadores);
      setPendientes(resPendientes);
    } catch (err) {
      setError(err.message || 'Error al cargar los datos del panel de control institucional.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, [currentActor]);

  const handleAbrirAccion = (reserva, accion) => {
    setModalAccion({
      isOpen: true,
      reserva,
      accion,
      loading: false
    });
  };

  const ejecutarAccionAdmin = async () => {
    const { reserva, accion } = modalAccion;
    if (!reserva) return;

    try {
      setModalAccion((prev) => ({ ...prev, loading: true }));
      await reservationService.changeStatus(reserva.id, {
        nuevoEstado: accion,
        administradorUsuarioId: currentUser?.id
      });

      setFeedback({
        type: 'success',
        title: `Solicitud ${accion}`,
        message: `La solicitud para "${reserva.ambienteNombre}" fue ${accion.toLowerCase()} con éxito.`
      });

      setModalAccion({ isOpen: false, reserva: null, accion: '', loading: false });
      cargarDashboard();
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Error de Regla de Negocio',
        message: err.message
      });
      setModalAccion((prev) => ({ ...prev, loading: false }));
    }
  };

  const isAdmin = currentActor === 'Administrador';
  const isSolicitante = currentActor === 'Solicitante';
  const isResponsable = currentActor === 'Responsable de ambiente';

  // Cálculo de ratio de aprobación institucional
  const total = data?.totalReservas || 0;
  const aprobadas = data?.reservasAprobadas || 0;
  const pendientesCount = data?.reservasPendientes || 0;
  const rechazadas = data?.reservasRechazadas || 0;
  const tasaAprobacion = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* 1. HERO BANNER DE MANDO EJECUTIVO (ESTILO GIMENA) */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2.5 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Semestre Académico 2026-I</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Bienvenido(a), {currentUser?.nombreCompleto || 'Usuario Institucional'}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
              {isAdmin &&
                'Centro de control institucional para la auditoría de espacios universitarios, aprobación de solicitudes en tiempo real y administración de recursos académicos.'}
              {isSolicitante &&
                'Consulta la disponibilidad horaria del campus y gestiona tus reservas de aulas con verificación inmediata de reglas de negocio.'}
              {isResponsable &&
                'Monitoreo operativo de la agenda de los espacios a tu cargo y actualización del estado de mantenimiento.'}
            </p>

            {isAdmin && pendientesCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  Hay <strong className="text-white">{pendientesCount} solicitud(es)</strong> esperando tu decisión administrativa.
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={cargarDashboard}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
            >
              Actualizar
            </Button>

            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                icon={Clock}
                onClick={() => handleNavigate('solicitudes', { estado: 'Pendiente' })}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30"
              >
                Revisar Pendientes ({pendientesCount})
              </Button>
            )}

            {isSolicitante && (
              <Button
                variant="primary"
                size="md"
                icon={PlusCircle}
                onClick={() => handleNavigate('solicitar-espacio')}
                className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/30"
              >
                Solicitar Espacio
              </Button>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <AlertMessage
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {error && <AlertMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* 2. HUB CENTRAL DE MÉTRICAS PANORÁMICO (NUEVA FORMA DE CARDS INTEGRADA) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#003366]" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Panel Consolidado de Solicitudes y Ocupación
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Estado operativo de reservas tramitadas bajo las reglas institucionales RN-01 a RN-06.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#003366] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Tasa de Aprobación: {tasaAprobacion}%
            </span>
          </div>
        </div>

        {/* 4 BLOQUES MÉTRICOS INTERCONECTADOS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Bloque 1: Solicitudes Aprobadas */}
          <div
            onClick={() => handleNavigate('solicitudes', { estado: 'Aprobada' })}
            className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                Aprobadas
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-mono text-emerald-900">
              {data ? aprobadas : '...'}
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
              Espacios y horarios vigentes
            </div>
          </div>

          {/* Bloque 2: Solicitudes Pendientes */}
          <div
            onClick={() => handleNavigate('solicitudes', { estado: 'Pendiente' })}
            className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                Por Evaluar
              </span>
              <Clock className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-mono text-amber-900">
              {data ? pendientesCount : '...'}
            </div>
            <div className="mt-2 text-[11px] text-amber-700 font-semibold">
              Requieren autorización
            </div>
          </div>

          {/* Bloque 3: Solicitudes Rechazadas */}
          <div
            onClick={() => handleNavigate('solicitudes', { estado: 'Rechazada' })}
            className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                Rechazadas
              </span>
              <XCircle className="h-4 w-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-mono text-rose-900">
              {data ? rechazadas : '...'}
            </div>
            <div className="mt-2 text-[11px] text-rose-700 font-semibold">
              Inmutables (RN-06)
            </div>
          </div>

          {/* Bloque 4: Total de Solicitudes */}
          <div
            onClick={() => handleNavigate('solicitudes')}
            className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#003366]">
                Total Solicitudes
              </span>
              <CalendarDays className="h-4 w-4 text-[#003366] group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-mono text-[#003366]">
              {data ? total : '...'}
            </div>
            <div className="mt-2 text-[11px] text-blue-800 font-semibold">
              Trámites acumulados
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO DE FLUJO VISUAL */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>Distribución de Estado de Solicitudes</span>
            <span>{aprobadas} aprobadas de {total} totales</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${total > 0 ? (aprobadas / total) * 100 : 0}%` }}
              title="Aprobadas"
            />
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${total > 0 ? (pendientesCount / total) * 100 : 0}%` }}
              title="Pendientes"
            />
            <div
              className="bg-rose-400 transition-all duration-500"
              style={{ width: `${total > 0 ? (rechazadas / total) * 100 : 0}%` }}
              title="Rechazadas"
            />
          </div>
        </div>
      </div>

      {/* 3. BENTO GRID ASIMÉTRICO (COLUMNA PRINCIPAL 65% + COLUMNA LATERAL 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* COLUMNA IZQUIERDA (8 COLUMNAS DE 12): SOLICITUDES PENDIENTES & DEMANDA */}
        <div className="lg:col-span-8 space-y-7">
          
          {/* MÓDULO ADMINISTRATIVO: TICKETS DE SOLICITUDES PENDIENTES */}
          {isAdmin && (
            <div className="rounded-3xl border border-amber-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Cola de Aprobación Inmediata
                    </h3>
                    <p className="text-xs text-slate-500">
                      Decisión exclusiva del Administrador General (RN-05).
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => handleNavigate('solicitudes', { estado: 'Pendiente' })}
                  className="font-bold text-xs"
                >
                  Ver Todas ({pendientesCount})
                </Button>
              </div>

              {pendientes.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <Check className="h-7 w-7 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    ¡Excelente! No hay solicitudes pendientes por evaluar.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Todas las solicitudes han sido atendidas conforme a disponibilidad.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendientes.slice(0, 3).map((res) => (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {res.ambienteNombre}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-[#003366] rounded-md">
                            {res.ambienteTipo}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                            {res.fecha} • {res.horaInicio.slice(0, 5)} - {res.horaFin.slice(0, 5)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Docente:</span>
                          <span>{res.usuarioNombre}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({res.usuarioCodigo || 'UPLA'})
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 italic truncate max-w-lg m-0">
                          &quot;{res.motivo}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleAbrirAccion(res, 'Aprobada')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs min-h-[36px]"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleAbrirAccion(res, 'Rechazada')}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 text-xs min-h-[36px]"
                        >
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEMANDA COMPARATIVA POR ESPACIOS UNIVERSITARIOS */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Demanda por Espacio Universitario
                </h3>
                <p className="text-xs text-slate-500">
                  Proporción de uso académico acumulado por cada ambiente.
                </p>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                {data?.usoPorAmbiente?.length || 0} aulas registradas
              </span>
            </div>

            <div className="space-y-4">
              {data?.usoPorAmbiente && data.usoPorAmbiente.length > 0 ? (
                data.usoPorAmbiente.map((item) => {
                  const max = Math.max(...data.usoPorAmbiente.map((x) => x.totalReservas), 1);
                  const porcentaje = Math.round((item.totalReservas / max) * 100);

                  return (
                    <div key={item.ambienteId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-extrabold text-slate-800">{item.nombre}</span>
                        <span className="text-slate-500 font-bold text-xs">
                          {item.totalReservas} solicitudes ({item.aprobadas} confirmadas)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="bg-gradient-to-r from-[#003366] to-sky-600 rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No se registran datos de uso histórico aún.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4 COLUMNAS DE 12): DESTACADOS Y ACCESOS RÁPIDOS */}
        <div className="lg:col-span-4 space-y-7">
          
          {/* TARJETA PODIO: ESPACIO CON MAYOR DEMANDA */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 border border-blue-200/90 p-6 shadow-xs relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#003366] text-xs font-black uppercase tracking-wider">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Espacio Más Solicitado</span>
              </div>
              <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                Ranking #1
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                {data ? data.ambienteMasUtilizadoNombre : 'Cargando...'}
              </h3>
              {data?.ambienteMasUtilizadoTipo && (
                <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-blue-100/80 text-[#003366] text-xs font-bold">
                  {data.ambienteMasUtilizadoTipo}
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-blue-100 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Reservas Confirmadas
                </span>
                <span className="text-3xl font-black text-[#003366] font-mono">
                  {data ? data.ambienteMasUtilizadoTotal : 0}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('espacios')}
                className="text-xs font-bold bg-white text-[#003366] border-blue-200 hover:bg-blue-50"
              >
                Ver Espacios
              </Button>
            </div>
          </div>

          {/* RESUMEN DE INFRAESTRUCTURA DEL CAMPUS */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Infraestructura del Campus
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#003366]" />
                  <span className="text-xs font-bold text-slate-700">Espacios Físicos</span>
                </div>
                <span className="text-lg font-black font-mono text-slate-900">
                  {data?.totalAmbientes ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Disponibles</span>
                </div>
                <span className="text-lg font-black font-mono text-emerald-900">
                  {data?.ambientesDisponibles ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#003366]" />
                  <span className="text-xs font-bold text-blue-900">Usuarios Registrados</span>
                </div>
                <span className="text-lg font-black font-mono text-[#003366]">
                  {data?.totalUsuarios ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* ACCESOS DIRECTOS DEL SISTEMA */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Operaciones Rápidas
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleNavigate('calendario')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#003366] hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                  <Calendar className="h-4 w-4 text-[#003366]" />
                  <span>Calendario de Ocupación</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#003366] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('estadisticas')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#003366] hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                  <BarChart3 className="h-4 w-4 text-[#003366]" />
                  <span>Métricas y Reportes (Excel/PDF)</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#003366] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE DECISIÓN ADMINISTRATIVA */}
      <ModalConfirmacion
        isOpen={modalAccion.isOpen}
        onClose={() => setModalAccion({ isOpen: false, reserva: null, accion: '', loading: false })}
        onConfirm={ejecutarAccionAdmin}
        loading={modalAccion.loading}
        title={
          modalAccion.accion === 'Aprobada'
            ? '¿Aprobar esta solicitud de espacio institucional?'
            : '¿Rechazar esta solicitud de espacio institucional?'
        }
        message={
          modalAccion.accion === 'Aprobada'
            ? `Se confirmará oficialmente el uso del ambiente "${modalAccion.reserva?.ambienteNombre}" para ${modalAccion.reserva?.usuarioNombre} el ${modalAccion.reserva?.fecha} de ${modalAccion.reserva?.horaInicio?.slice(0, 5)} a ${modalAccion.reserva?.horaFin?.slice(0, 5)} hrs.`
            : 'Atención: Una solicitud rechazada no podrá modificarse posteriormente (RN-06).'
        }
        confirmText={
          modalAccion.accion === 'Aprobada'
            ? 'Sí, Aprobar Solicitud'
            : 'Sí, Rechazar Solicitud'
        }
        confirmVariant={modalAccion.accion === 'Aprobada' ? 'success' : 'danger'}
      />
    </div>
  );
}
