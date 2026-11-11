import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  Building2,
  User,
  FileSpreadsheet,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import TableList from '../components/ui/TableList';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import SelectInput from '../components/ui/SelectInput';
import DateInput from '../components/ui/DateInput';
import Tooltip from '../components/ui/Tooltip';
import { reservaService as reservaApi, ambienteService as ambienteApi } from '../service';
import { useAuth } from '../context/AuthContext';

export default function SolicitudesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentActor, currentUser } = useAuth();

  const initialEstado = searchParams.get('estado') || '';

  const [reservas, setReservas] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState(initialEstado);
  const [filtroAmbiente, setFiltroAmbiente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Estados del modal de confirmación de acción
  const [modalAccion, setModalAccion] = useState({
    isOpen: false,
    reserva: null,
    accion: '', // 'Aprobada' | 'Rechazada' | 'Cancelada'
    loading: false
  });

  const [feedback, setFeedback] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setFeedback(null);

      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroAmbiente) params.ambienteId = filtroAmbiente;
      if (filtroFecha) params.fecha = filtroFecha;

      const [resData, ambData] = await Promise.all([
        reservaApi.obtenerTodas(params),
        ambienteApi.obtenerTodos()
      ]);

      setReservas(resData);
      setAmbientes(ambData);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar las solicitudes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroAmbiente, filtroFecha]);

  const handleVerDetalle = (reserva) => {
    setReservaSeleccionada(reserva);
    setModalDetalleOpen(true);
  };

  const handleAbrirAccion = (reserva, accion) => {
    if (reserva.estado === 'Rechazada') {
      setFeedback({
        type: 'warning',
        title: 'Solicitud Finalizada',
        message: 'Una solicitud rechazada no podrá modificarse.'
      });
      return;
    }

    if ((accion === 'Aprobada' || accion === 'Rechazada') && currentActor !== 'Administrador') {
      setFeedback({
        type: 'error',
        title: 'Acceso Restringido',
        message: 'Solo el administrador general puede aprobar o rechazar solicitudes.'
      });
      return;
    }

    setModalAccion({
      isOpen: true,
      reserva,
      accion,
      loading: false
    });
  };

  const ejecutarCambioEstado = async () => {
    const { reserva, accion } = modalAccion;
    if (!reserva) return;

    try {
      setModalAccion((prev) => ({ ...prev, loading: true }));

      if (accion === 'Cancelada') {
        await reservaApi.cancelar(reserva.id, currentUser?.id);
        setFeedback({
          type: 'info',
          title: 'Solicitud Cancelada',
          message: `La solicitud para el ambiente "${reserva.ambienteNombre}" fue cancelada correctamente.`
        });
      } else {
        await reservaApi.cambiarEstado(reserva.id, {
          nuevoEstado: accion,
          administradorUsuarioId: currentUser?.id
        });
        setFeedback({
          type: 'success',
          title: `Solicitud ${accion}`,
          message: `La solicitud para "${reserva.ambienteNombre}" fue marcada como ${accion.toUpperCase()}.`
        });
      }

      setModalAccion({ isOpen: false, reserva: null, accion: '', loading: false });
      cargarDatos();
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Conflicto o Error de Validación',
        message: err.message
      });
      setModalAccion((prev) => ({ ...prev, loading: false }));
    }
  };

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Aprobada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Aprobada</span>
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pendiente</span>
          </span>
        );
      case 'Rechazada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Rechazada</span>
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
            <Ban className="h-3.5 w-3.5 text-slate-500" />
            <span>Cancelada</span>
          </span>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      header: 'Espacio Solicitado',
      accessor: 'ambienteNombre',
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-900 block">{row.ambienteNombre}</span>
          <span className="text-[11px] font-semibold text-[#003366] bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
            {row.ambienteTipo}
          </span>
        </div>
      )
    },
    {
      header: 'Fecha y Horario',
      accessor: 'fecha',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.fecha}</span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-0.5 inline-block">
            {row.horaInicio.slice(0, 5)} - {row.horaFin.slice(0, 5)} hrs
          </span>
        </div>
      )
    },
    {
      header: 'Docente / Solicitante',
      accessor: 'usuarioNombre',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.usuarioNombre}</span>
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            {row.usuarioCodigo || 'DOC-UPLA'}
          </span>
        </div>
      )
    },
    {
      header: 'Motivo de Actividad',
      accessor: 'motivo',
      render: (row) => (
        <span className="text-xs text-slate-600 block max-w-xs truncate" title={row.motivo}>
          {row.motivo}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (row) => getBadgeEstado(row.estado)
    },
    {
      header: 'Acciones de Gestión',
      align: 'right',
      render: (row) => {
        const esAdmin = currentActor === 'Administrador';
        const esRechazada = row.estado === 'Rechazada';
        const esPendiente = row.estado === 'Pendiente';

        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            <Tooltip content="Ver detalles completos de la solicitud">
              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={() => handleVerDetalle(row)}
                className="p-2"
                aria-label="Ver detalles"
              />
            </Tooltip>

            {esAdmin && esPendiente && !esRechazada && (
              <>
                <Tooltip content="Aprobar solicitud de espacio institucional">
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleAbrirAccion(row, 'Aprobada')}
                    className="px-3"
                  >
                    Aprobar
                  </Button>
                </Tooltip>

                <Tooltip content="Rechazar solicitud institucional">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleAbrirAccion(row, 'Rechazada')}
                    className="px-3"
                  >
                    Rechazar
                  </Button>
                </Tooltip>
              </>
            )}

            {row.estado === 'Aprobada' && esAdmin && (
              <Tooltip content="Cancelar reserva aprobada">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Ban}
                  onClick={() => handleAbrirAccion(row, 'Cancelada')}
                  className="text-slate-500 hover:text-red-700"
                >
                  Cancelar
                </Button>
              </Tooltip>
            )}

            {esRechazada && (
              <span className="text-[11px] font-bold text-slate-400 italic px-2">
                Sin acciones
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
              <span>Control Institucional • Evaluación de Solicitudes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Gestión y Aprobación de Solicitudes</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
              Supervisión de reservas de aulas y auditorios. Evalúa pertinencia y autoriza o deniega solicitudes según disponibilidad en el Campus Huancayo (RN-05 & RN-06).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Button
              variant="outline"
              icon={FileSpreadsheet}
              size="md"
              onClick={() => navigate('/estadisticas')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
            >
              Descargar Informe
            </Button>

            <Button
              variant="outline"
              icon={CalendarDays}
              size="md"
              onClick={() => navigate('/calendario')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
            >
              Ver Calendario
            </Button>

            <Button
              variant="outline"
              icon={RefreshCw}
              size="md"
              onClick={cargarDatos}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
            >
              Actualizar
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

      {/* BARRA DE PESTAÑAS RÁPIDAS DE ESTADO (PIPELINE GIMENA) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: '', label: 'Todas las Solicitudes' },
              { id: 'Pendiente', label: 'Por Evaluar' },
              { id: 'Aprobada', label: 'Aprobadas Vigentes' },
              { id: 'Rechazada', label: 'Rechazadas' },
              { id: 'Cancelada', label: 'Canceladas' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filtroEstado === tab.id
                    ? 'bg-[#003366] text-white shadow-sm shadow-[#003366]/20 font-black'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-500 font-mono">
            {reservas.length} registros listados
          </span>
        </div>

        {/* FILTROS DE BÚSQUEDA SECUNDARIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <SelectInput
            label="Filtrar por Espacio"
            value={filtroAmbiente}
            onChange={(e) => setFiltroAmbiente(e.target.value)}
            options={[
              { value: '', label: 'Todos los espacios' },
              ...ambientes.map((a) => ({ value: a.id, label: `${a.nombre} (${a.tipo})` }))
            ]}
          />

          <DateInput
            label="Filtrar por Fecha"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            helperText="Dejar vacío para ver todas las fechas"
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL DE SOLICITUDES */}
      <TableList
        columns={columns}
        data={reservas}
        loading={loading}
        emptyMessage="No se encontraron solicitudes registradas con los filtros seleccionados."
      />

      {/* MODAL DETALLES DE SOLICITUD */}
      {modalDetalleOpen && reservaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                Detalle de Solicitud Institucional
              </h2>
              <div>{getBadgeEstado(reservaSeleccionada.estado)}</div>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs text-slate-400 block">Fecha Programada</span>
                  <span className="font-semibold text-slate-900">{reservaSeleccionada.fecha}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Horario</span>
                  <span className="font-semibold text-[#003366]">
                    {reservaSeleccionada.horaInicio.slice(0, 5)} - {reservaSeleccionada.horaFin.slice(0, 5)} hrs
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Motivo Institucional</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                  {reservaSeleccionada.motivo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                    <User className="h-3.5 w-3.5" /> Solicitante
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{reservaSeleccionada.usuarioNombre}</div>
                  <div className="text-[11px] font-mono font-bold text-slate-500">{reservaSeleccionada.usuarioCodigo || 'Docente UPLA'}</div>
                </div>

                <div className="border border-slate-100 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
                    <Building2 className="h-3.5 w-3.5" /> Ubicación y Capacidad
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{reservaSeleccionada.ambienteUbicacion}</div>
                  <div className="text-[11px] text-slate-500">Capacidad: {reservaSeleccionada.ambienteCapacidad} personas</div>
                </div>
              </div>

              {reservaSeleccionada.estado === 'Rechazada' && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Esta solicitud se encuentra rechazada y ya no puede ser modificada.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setModalDetalleOpen(false)}>
                Cerrar
              </Button>

              {reservaSeleccionada.estado === 'Pendiente' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => {
                      setModalDetalleOpen(false);
                      handleAbrirAccion(reservaSeleccionada, 'Rechazada');
                    }}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => {
                      setModalDetalleOpen(false);
                      handleAbrirAccion(reservaSeleccionada, 'Aprobada');
                    }}
                  >
                    Aprobar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE ACCIÓN */}
      <ModalConfirmacion
        isOpen={modalAccion.isOpen}
        onClose={() => setModalAccion({ isOpen: false, reserva: null, accion: '', loading: false })}
        onConfirm={ejecutarCambioEstado}
        loading={modalAccion.loading}
        title={
          modalAccion.accion === 'Aprobada'
            ? '¿Aprobar esta solicitud institucional?'
            : modalAccion.accion === 'Rechazada'
            ? '¿Rechazar esta solicitud institucional?'
            : '¿Cancelar esta reserva?'
        }
        message={
          modalAccion.accion === 'Aprobada'
            ? `Se confirmará el uso del espacio "${modalAccion.reserva?.ambienteNombre}" para el ${modalAccion.reserva?.fecha} de ${modalAccion.reserva?.horaInicio?.slice(0, 5)} a ${modalAccion.reserva?.horaFin?.slice(0, 5)} hrs.`
            : modalAccion.accion === 'Rechazada'
            ? 'Atención: Una solicitud rechazada no podrá modificarse posteriormente.'
            : 'La solicitud pasará a estado Cancelada y el horario quedará liberado.'
        }
        confirmText={
          modalAccion.accion === 'Aprobada'
            ? 'Sí, Aprobar Solicitud'
            : modalAccion.accion === 'Rechazada'
            ? 'Sí, Rechazar Solicitud'
            : 'Sí, Cancelar Solicitud'
        }
        confirmVariant={modalAccion.accion === 'Aprobada' ? 'success' : 'danger'}
      />
    </div>
  );
}
