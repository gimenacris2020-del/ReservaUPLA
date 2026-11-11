import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog as BaseDialog } from '@base-ui/react';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import Tooltip from '../components/ui/Tooltip';
import { reservationService } from '../service';
import { useAuth } from '../context/AuthContext';

export default function MisSolicitudesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  // Modal para ver detalles completos
  const [detalleReserva, setDetalleReserva] = useState(null);

  // Modal para confirmar cancelación de solicitud pendiente
  const [cancelarModal, setCancelarModal] = useState({
    isOpen: false,
    reserva: null,
    loading: false
  });

  const cargarMisReservas = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const data = await reservationService.getAll();

      // Filtrar únicamente las solicitudes del usuario docente actual
      const misReservas = data.filter((r) => {
        if (!currentUser) return true;
        return (
          r.usuarioId === currentUser.id ||
          r.usuarioCorreo?.toLowerCase() === currentUser.correo?.toLowerCase() ||
          r.usuarioCodigo?.toUpperCase() === currentUser.codigo?.toUpperCase()
        );
      });

      setReservas(misReservas);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Error al consultar solicitudes',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisReservas();
  }, [currentUser]);

  // Filtrado por estado
  const reservasFiltradas = useMemo(() => {
    if (filtroEstado === 'Todas') return reservas;
    return reservas.filter((r) => r.estado === filtroEstado);
  }, [reservas, filtroEstado]);

  // Manejar cancelación de solicitud pendiente
  const handleConfirmarCancelar = async () => {
    const { reserva } = cancelarModal;
    if (!reserva) return;

    try {
      setCancelarModal((prev) => ({ ...prev, loading: true }));
      await reservationService.cancel(reserva.id);

      setFeedback({
        type: 'info',
        title: 'Solicitud Cancelada',
        message: `La solicitud para "${reserva.ambienteNombre}" del ${reserva.fecha} fue cancelada correctamente.`
      });

      setCancelarModal({ isOpen: false, reserva: null, loading: false });
      cargarMisReservas();
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'No se pudo cancelar la solicitud',
        message: err.message
      });
      setCancelarModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA */}
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <ClipboardList className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Gestión Docente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Mis Solicitudes de Espacios</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
              Supervisión en tiempo real de tus peticiones de reserva de laboratorios, auditorios y salas institucionales (RF-05).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              icon={RefreshCw}
              size="md"
              onClick={cargarMisReservas}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
            >
              Actualizar
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              size="md"
              onClick={() => navigate('/solicitar-espacio')}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/20"
            >
              Nueva Solicitud
            </Button>
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

      {/* FILTROS DE ESTADO */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filtrar por Estado:</span>
          {['Todas', 'Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'].map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filtroEstado === est
                  ? 'bg-[#003366] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {est}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-500">
          Mostrando <strong>{reservasFiltradas.length}</strong> de {reservas.length} solicitudes
        </span>
      </div>

      {/* LISTADO DE TARJETAS */}
      {reservasFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            No tienes solicitudes registradas en este estado
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Puedes explorar los laboratorios y auditorios universitarios disponibles en el calendario y registrar una nueva solicitud.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/calendario')}>
              Ir al Calendario de Ocupación
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reservasFiltradas.map((r) => {
            const estadoBadge = {
              Aprobada: {
                bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                icon: CheckCircle2,
                label: 'Aprobada (Confirmada)'
              },
              Pendiente: {
                bg: 'bg-amber-50 text-amber-800 border-amber-200',
                icon: AlertCircle,
                label: 'Pendiente de Revisión'
              },
              Rechazada: {
                bg: 'bg-rose-50 text-rose-800 border-rose-200',
                icon: XCircle,
                label: 'Rechazada por Admin'
              },
              Cancelada: {
                bg: 'bg-slate-100 text-slate-600 border-slate-200',
                icon: XCircle,
                label: 'Cancelada'
              }
            }[r.estado] || { bg: 'bg-slate-100 text-slate-700', icon: AlertCircle, label: r.estado };

            const Icon = estadoBadge.icon;
            const hInicio = r.horaInicio.slice(0, 5);
            const hFin = r.horaFin.slice(0, 5);
            const fechaPartes = r.fecha.split('-');
            const dia = fechaPartes[2] || '01';
            const anio = fechaPartes[0] || '2026';
            const mesNum = parseInt(fechaPartes[1] || '1', 10);
            const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
            const mesNombre = meses[mesNum - 1] || 'MES';

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-stretch overflow-hidden group"
              >
                {/* BLOQUE LATERAL FECHA / PASE HORARIO TIPO TICKET */}
                <div className="sm:w-44 bg-gradient-to-br from-[#002244] to-[#003366] text-white p-5 flex sm:flex-col items-center justify-between sm:justify-center text-center shrink-0 border-b sm:border-b-0 sm:border-r border-blue-900/50">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 block">
                      {mesNombre} {anio}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono leading-none my-1 block text-white">
                      {dia}
                    </span>
                  </div>

                  <div className="mt-0 sm:mt-2 px-2.5 py-1 rounded-lg bg-white/10 text-sky-200 text-xs font-mono font-bold border border-white/15">
                    {hInicio} - {hFin} hrs
                  </div>
                </div>

                {/* CONTENIDO PRINCIPAL DE LA SOLICITUD */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {r.ambienteTipo}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {r.ambienteUbicacion}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${estadoBadge.bg}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{estadoBadge.label}</span>
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight group-hover:text-[#003366] transition-colors">
                      {r.ambienteNombre}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                      <strong className="text-slate-800">Motivo: </strong>
                      {r.motivo}
                    </p>
                  </div>

                  {/* PIE DE ACCIONES */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDetalleReserva(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Ficha Completa</span>
                    </button>

                    {r.estado === 'Pendiente' && (
                      <button
                        type="button"
                        onClick={() => setCancelarModal({ isOpen: true, reserva: r, loading: false })}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancelar Solicitud</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLES DE LA SOLICITUD */}
      <BaseDialog.Root open={!!detalleReserva} onOpenChange={(open) => !open && setDetalleReserva(null)}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-fadeIn" />
          <BaseDialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl max-w-lg w-[calc(100%-2rem)] p-6 sm:p-7 shadow-2xl border border-slate-100 outline-none">
            <BaseDialog.Close
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Cerrar detalles"
            >
              <X className="h-5 w-5" />
            </BaseDialog.Close>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-blue-100 text-[#003366] flex items-center justify-center font-bold shrink-0">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <BaseDialog.Title className="text-lg font-black text-slate-900 m-0">
                  Detalles de tu Solicitud
                </BaseDialog.Title>
                <BaseDialog.Description className="text-xs text-slate-500 m-0 mt-0.5">
                  Información registrada en el sistema institucional
                </BaseDialog.Description>
              </div>
            </div>

            {detalleReserva && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Estado:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        detalleReserva.estado === 'Aprobada'
                          ? 'bg-blue-50 text-[#003366] border-blue-200'
                          : detalleReserva.estado === 'Pendiente'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {detalleReserva.estado}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Fecha:</span>
                    <span className="font-mono font-bold text-slate-900">{detalleReserva.fecha}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Horario:</span>
                    <span className="font-mono font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {detalleReserva.horaInicio.slice(0, 5)} - {detalleReserva.horaFin.slice(0, 5)} hrs
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Espacio Universitario
                  </span>
                  <div className="font-bold text-slate-900">{detalleReserva.ambienteNombre}</div>
                  <div className="text-xs text-slate-500">
                    {detalleReserva.ambienteTipo} • {detalleReserva.ambienteUbicacion}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Motivo Registrado
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                    {detalleReserva.motivo}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <BaseDialog.Close className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors">
                Cerrar
              </BaseDialog.Close>
            </div>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>

      {/* MODAL CONFIRMAR CANCELACIÓN */}
      <ModalConfirmacion
        isOpen={cancelarModal.isOpen}
        title="¿Deseas cancelar esta solicitud de espacio?"
        message={`Se cancelará tu solicitud pendiente para "${cancelarModal.reserva?.ambienteNombre}" del ${cancelarModal.reserva?.fecha}.`}
        confirmText="Sí, cancelar solicitud"
        cancelText="Conservar solicitud"
        variant="danger"
        loading={cancelarModal.loading}
        onConfirm={handleConfirmarCancelar}
        onCancel={() => setCancelarModal({ isOpen: false, reserva: null, loading: false })}
      />
    </div>
  );
}
