import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ShieldCheck,
  CheckCircle,
  Building2,
  Clock,
  User,
  Sparkles,
  ArrowLeft,
  Users,
  MapPin,
  Laptop
} from 'lucide-react';
import SelectInput from '../components/ui/SelectInput';
import DateInput from '../components/ui/DateInput';
import TimeInput from '../components/ui/TimeInput';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import {
  usuarioService as usuarioApi,
  ambienteService as ambienteApi,
  reservaService as reservaApi
} from '../service';
import { useAuth } from '../context/AuthContext';

export default function RegistrarSolicitudPage() {
  const navigate = useNavigate();
  const { currentUser, currentActor } = useAuth();
  const hoyStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    usuarioId: currentUser?.id || '',
    ambienteId: '',
    fecha: hoyStr,
    horaInicio: '08:00',
    horaFin: '10:00',
    motivo: ''
  });

  const [usuarios, setUsuarios] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [verificando, setVerificando] = useState(false);
  const [resultadoDisponibilidad, setResultadoDisponibilidad] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [mensajeError, setMensajeError] = useState(null);

  const [erroresFront, setErroresFront] = useState({});

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingInit(true);
        const [uRes, aRes] = await Promise.all([
          usuarioApi.obtenerTodos(),
          ambienteApi.obtenerTodos({ estado: 'Disponible' })
        ]);
        setUsuarios(uRes);
        setAmbientes(aRes);

        if (currentUser?.id) {
          setFormData((prev) => ({ ...prev, usuarioId: currentUser.id }));
        } else if (uRes.length > 0) {
          setFormData((prev) => ({ ...prev, usuarioId: uRes[0].id }));
        }

        if (aRes.length > 0) {
          setFormData((prev) => ({ ...prev, ambienteId: aRes[0].id }));
        }
      } catch (err) {
        setMensajeError('No se pudieron cargar usuarios y espacios institucionales: ' + err.message);
      } finally {
        setLoadingInit(false);
      }
    };

    cargarDatos();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setResultadoDisponibilidad(null);
    setMensajeExito(null);
    setMensajeError(null);

    if (erroresFront[name]) {
      setErroresFront((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validarFormularioFrontend = () => {
    const errs = {};

    if (!formData.usuarioId) {
      errs.usuarioId = 'Debe seleccionar el solicitante institucional.';
    }

    if (!formData.ambienteId) {
      errs.ambienteId = 'Debe seleccionar el espacio universitario.';
    }

    if (!formData.fecha) {
      errs.fecha = 'La fecha de reserva es obligatoria.';
    }

    if (!formData.horaInicio) {
      errs.horaInicio = 'La hora de inicio es requerida.';
    }

    if (!formData.horaFin) {
      errs.horaFin = 'La hora de fin es requerida.';
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        errs.horaFin = 'La hora de inicio debe ser anterior a la hora de fin.';
      }
    }

    if (!formData.motivo || formData.motivo.trim().length < 5) {
      errs.motivo = 'El motivo de la solicitud es obligatorio (mínimo 5 caracteres).';
    }

    setErroresFront(errs);
    return Object.keys(errs).length === 0;
  };

  const handleVerificarDisponibilidad = async () => {
    if (!formData.ambienteId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
      setMensajeError('Para verificar disponibilidad complete ambiente, fecha y horarios.');
      return;
    }

    if (formData.horaInicio >= formData.horaFin) {
      setMensajeError('La hora de inicio debe ser menor que la hora de fin.');
      return;
    }

    try {
      setVerificando(true);
      setMensajeError(null);
      const res = await reservaApi.verificarDisponibilidad({
        ambienteId: formData.ambienteId,
        fecha: formData.fecha,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin
      });
      setResultadoDisponibilidad(res);
    } catch (err) {
      setMensajeError(err.message || 'Error al verificar disponibilidad.');
    } finally {
      setVerificando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormularioFrontend()) {
      return;
    }

    try {
      setEnviando(true);
      setMensajeError(null);
      setMensajeExito(null);

      const nuevaReserva = await reservaApi.crear({
        usuarioId: formData.usuarioId,
        ambienteId: formData.ambienteId,
        fecha: formData.fecha,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        motivo: formData.motivo.trim()
      });

      setMensajeExito(
        `¡Solicitud registrada con éxito! Código: ${nuevaReserva.id.slice(0, 8)}... Estado: Pendiente de aprobación.`
      );
      setResultadoDisponibilidad(null);

      const returnPath = currentActor === 'Solicitante' ? '/mis-solicitudes' : '/solicitudes';
      setTimeout(() => {
        navigate(returnPath);
      }, 1200);
    } catch (err) {
      setMensajeError(err.message || 'No se pudo registrar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const ambienteSeleccionado = ambientes.find((a) => a.id === formData.ambienteId);
  const backPath = currentActor === 'Solicitante' ? '/mis-solicitudes' : '/solicitudes';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Gestión Académica 2026-I</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="h-7 w-7 text-sky-400" />
              <span>Registrar Solicitud de Espacio</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 mt-1 max-w-xl">
              Reserve aulas, laboratorios y auditorios con validación automática de disponibilidad horaria sin solapamiento (RN-01 a RN-04).
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(backPath)}
            className="self-start sm:self-auto bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
          >
            Volver al Listado
          </Button>
        </div>
      </div>

      {/* MENSAJES DE FEEDBACK Y ALERTAS */}
      {mensajeExito && (
        <AlertMessage
          type="success"
          title="Solicitud Registrada con Éxito"
          message={mensajeExito}
          onClose={() => setMensajeExito(null)}
        />
      )}

      {mensajeError && (
        <AlertMessage
          type="error"
          title="Validación Institucional"
          message={mensajeError}
          onClose={() => setMensajeError(null)}
        />
      )}

      {resultadoDisponibilidad && (
        <AlertMessage
          type={resultadoDisponibilidad.disponible ? 'success' : 'error'}
          title={resultadoDisponibilidad.disponible ? 'Horario Disponible' : 'Conflicto de Horario'}
          message={resultadoDisponibilidad.mensaje}
          onClose={() => setResultadoDisponibilidad(null)}
        />
      )}

      {/* FORMULARIO ESTRUCTURADO Y MODERNO CON ALINEACIÓN PERFECTA */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOQUE 1: ACTOR Y ESPACIO SELECCIONADO */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center font-black text-xs">
              1
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Solicitante y Espacio Universitario
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <SelectInput
              label="Solicitante Institucional"
              name="usuarioId"
              value={formData.usuarioId}
              onChange={handleChange}
              options={usuarios.map((u) => ({
                value: u.id,
                label: `${u.nombreCompleto} (${u.rol})`
              }))}
              error={erroresFront.usuarioId}
              required
              disabled={loadingInit}
            />

            <SelectInput
              label="Espacio Universitario"
              name="ambienteId"
              value={formData.ambienteId}
              onChange={handleChange}
              options={ambientes.map((a) => ({
                value: a.id,
                label: `${a.nombre} [Cap. ${a.capacidad}]`
              }))}
              error={erroresFront.ambienteId}
              required
              disabled={loadingInit}
            />
          </div>

          {/* FICHA PREVIA DEL ESPACIO SELECCIONADO */}
          {ambienteSeleccionado && (
            <div className="rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-slate-50 border border-blue-200/70 p-4 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#003366] shrink-0" />
                  <span className="font-extrabold text-[#003366] text-sm">
                    {ambienteSeleccionado.nombre}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#003366] font-bold text-[10px] uppercase">
                    {ambienteSeleccionado.tipo}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-[#003366] bg-white px-2.5 py-1 rounded-xl border border-blue-200 shrink-0">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  <span>Capacidad: {ambienteSeleccionado.capacidad} personas</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px] pt-1 border-t border-blue-100/80">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {ambienteSeleccionado.ubicacion}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Laptop className="h-3.5 w-3.5 text-slate-400" />
                  Equipamiento multimedia y red Wi-Fi UPLA
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE 2: PROGRAMACIÓN HORARIA (ALINEACIÓN HORIZONTAL IMPECABLE) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center font-black text-xs">
                2
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Programación de Horario
              </h2>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-[#003366]" />
              <span>Rango oficial: 07:00 a 22:00</span>
            </div>
          </div>

          {/* GRID DE 3 COLUMNAS: LABELS UNIFORMES Y BASELINE PERFECTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
            <DateInput
              label="Fecha de la Solicitud"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              min={hoyStr}
              error={erroresFront.fecha}
              required
            />

            <TimeInput
              label="Hora de Inicio"
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              min="07:00"
              max="21:45"
              helperText="Permitido desde las 07:00"
              error={erroresFront.horaInicio}
              required
            />

            <TimeInput
              label="Hora de Fin"
              name="horaFin"
              value={formData.horaFin}
              onChange={handleChange}
              min="07:15"
              max="22:00"
              helperText="Permitido hasta las 22:00"
              error={erroresFront.horaFin}
              required
            />
          </div>
        </div>

        {/* BLOQUE 3: JUSTIFICACIÓN ACADÉMICA */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center font-black text-xs">
              3
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Motivo y Justificación de la Actividad
            </h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="h-5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
              <label htmlFor="motivo" className="flex items-center gap-1 cursor-pointer">
                <span>Motivo de la Solicitud</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium lowercase">
                mínimo 5 caracteres
              </span>
            </div>
            <textarea
              id="motivo"
              name="motivo"
              rows={3}
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Ejemplo: Práctica guiada de Base de Datos para estudiantes del VI ciclo de Ingeniería de Sistemas..."
              className={`block w-full rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white p-3.5 text-sm transition-all outline-none font-medium
                ${
                  erroresFront.motivo
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-rose-900'
                    : 'border-slate-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-100/80 text-slate-900'
                }`}
            />
            {erroresFront.motivo && (
              <p className="text-xs text-rose-600 font-medium">{erroresFront.motivo}</p>
            )}
          </div>
        </div>

        {/* BARRA DE ACCIONES INFERIOR */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            icon={ShieldCheck}
            onClick={handleVerificarDisponibilidad}
            loading={verificando}
            className="w-full sm:w-auto font-bold text-slate-700 border-slate-300"
          >
            Validar Disponibilidad en Tiempo Real
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(backPath)}
              disabled={enviando}
              className="w-full sm:w-auto font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={CheckCircle}
              loading={enviando}
              className="w-full sm:w-auto font-bold bg-[#003366] hover:bg-[#002244] text-white shadow-md shadow-[#003366]/20 px-6 py-2.5 rounded-xl"
            >
              Registrar Solicitud
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
