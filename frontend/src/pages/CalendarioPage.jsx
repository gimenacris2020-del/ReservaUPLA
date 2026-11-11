import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Filter
} from 'lucide-react';
import { Dialog as BaseDialog } from '@base-ui/react';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import Tooltip from '../components/ui/Tooltip';
import { roomService, reservationService } from '../service';
import { useAuth } from '../context/AuthContext';

export default function CalendarioPage() {
  const { currentActor, currentUser } = useAuth();
  const isAdmin = currentActor === 'Administrador';
  const isDocente = currentActor === 'Solicitante';
  const isResponsable = currentActor === 'Responsable de ambiente';

  const hoyDate = new Date();
  const hoyStr = hoyDate.toISOString().split('T')[0];

  // Fecha seleccionada en el mini calendario
  const [selectedDate, setSelectedDate] = useState(hoyStr);
  const [currentMonth, setCurrentMonth] = useState(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1));

  // Datos
  const [ambientes, setAmbientes] = useState([]);
  const [selectedAmbienteIds, setSelectedAmbienteIds] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal para ver Detalle de una Reserva
  const [reservaDetalle, setReservaDetalle] = useState(null);

  // Modal de Nueva Reserva (Docente)
  const [modalReservaOpen, setModalReservaOpen] = useState(false);
  const [guardandoReserva, setGuardandoReserva] = useState(false);
  const [nuevaReserva, setNuevaReserva] = useState({
    ambienteId: '',
    fecha: hoyStr,
    horaInicio: '08:00',
    horaFin: '10:00',
    motivo: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Cargar ambientes
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        setLoading(true);
        const data = await roomService.getAll();
        setAmbientes(data);
        if (data.length > 0) {
          setSelectedAmbienteIds(data.map((a) => a.id));
          setNuevaReserva((prev) => ({ ...prev, ambienteId: data[0].id }));
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          title: 'Error de Conexión',
          message: 'No se pudo cargar los ambientes: ' + err.message
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAmbientes();
  }, []);

  // Cargar reservas
  const cargarReservas = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAll();
      setReservas(data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Error al consultar reservas: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  // Generación de opciones horarias de 30 minutos (07:00 a 22:00)
  const timeOptions = useMemo(() => {
    const list = [];
    for (let h = 7; h <= 22; h++) {
      const hh = String(h).padStart(2, '0');
      list.push(`${hh}:00`);
      if (h < 22) list.push(`${hh}:30`);
    }
    return list;
  }, []);

  const horaFinOptions = useMemo(() => {
    const startIdx = timeOptions.indexOf(nuevaReserva.horaInicio);
    if (startIdx === -1) return timeOptions.slice(1);
    return timeOptions.slice(startIdx + 1);
  }, [timeOptions, nuevaReserva.horaInicio]);

  const handleHoraInicioChange = (e) => {
    const newStart = e.target.value;
    const startIdx = timeOptions.indexOf(newStart);
    let newEnd = nuevaReserva.horaFin;
    const endIdx = timeOptions.indexOf(newEnd);

    if (endIdx <= startIdx) {
      const nextIdx = Math.min(startIdx + 2, timeOptions.length - 1);
      newEnd = timeOptions[nextIdx];
    }

    setNuevaReserva({
      ...nuevaReserva,
      horaInicio: newStart,
      horaFin: newEnd
    });
  };

  // Mini calendario: días del mes
  const miniCalendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: '', dateStr: '', isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dd = String(d).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === hoyStr,
        isSelected: dateStr === selectedDate
      });
    }
    return days;
  }, [currentMonth, selectedDate, hoyStr]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleIrAHoy = () => {
    setSelectedDate(hoyStr);
    setCurrentMonth(new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1));
  };

  const toggleAmbienteFilter = (ambId) => {
    setSelectedAmbienteIds((prev) =>
      prev.includes(ambId) ? prev.filter((id) => id !== ambId) : [...prev, ambId]
    );
  };

  // Agrupamiento de reservas por fecha
  const reservasAgrupadasPorFecha = useMemo(() => {
    const filtradas = reservas.filter((r) => {
      if (selectedAmbienteIds.length > 0 && !selectedAmbienteIds.includes(r.ambienteId)) {
        return false;
      }
      return r.fecha >= selectedDate;
    });

    const grupos = {};
    filtradas.forEach((res) => {
      if (!grupos[res.fecha]) {
        grupos[res.fecha] = [];
      }
      grupos[res.fecha].push(res);
    });

    const fechasOrdenadas = Object.keys(grupos).sort();

    return fechasOrdenadas.map((fecha) => {
      const [y, m, d] = fecha.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const diaNum = d;
      const mesStr = dateObj.toLocaleDateString('es-PE', { month: 'short' }).toUpperCase().replace('.', '');
      const diaSemanaStr = dateObj.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase().replace('.', '');

      const items = grupos[fecha].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      return {
        fecha,
        diaNum,
        mesStr,
        diaSemanaStr,
        isToday: fecha === hoyStr,
        items
      };
    });
  }, [reservas, selectedAmbienteIds, selectedDate, hoyStr]);

  // Manejo de envío de nueva reserva
  const handleCrearReserva = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!nuevaReserva.fecha || nuevaReserva.fecha < hoyStr) {
      setFormErrors({ fecha: 'No puedes seleccionar fechas pasadas. Solo de hoy en adelante.' });
      return;
    }

    if (!nuevaReserva.ambienteId) {
      setFormErrors({ ambienteId: 'Debes seleccionar un espacio universitario.' });
      return;
    }

    if (!nuevaReserva.motivo || nuevaReserva.motivo.trim().length < 5) {
      setFormErrors({ motivo: 'El motivo es obligatorio (mínimo 5 caracteres).' });
      return;
    }

    try {
      setGuardandoReserva(true);
      await reservationService.create({
        ambienteId: nuevaReserva.ambienteId,
        usuarioId: currentUser?.id,
        fecha: nuevaReserva.fecha,
        horaInicio: nuevaReserva.horaInicio.length === 5 ? `${nuevaReserva.horaInicio}:00` : nuevaReserva.horaInicio,
        horaFin: nuevaReserva.horaFin.length === 5 ? `${nuevaReserva.horaFin}:00` : nuevaReserva.horaFin,
        motivo: nuevaReserva.motivo.trim()
      });

      setFeedback({
        type: 'success',
        title: 'Solicitud Registrada con Éxito',
        message: `Tu solicitud para el espacio universitario ha quedado registrada en estado PENDIENTE. El Administrador revisará el horario y motivo para su aprobación.`
      });

      setModalReservaOpen(false);
      setNuevaReserva((prev) => ({
        ...prev,
        motivo: '',
        fecha: hoyStr
      }));
      cargarReservas();
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Conflicto o Error de Solicitud',
        message: err.message
      });
    } finally {
      setGuardandoReserva(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/10 text-sky-300 flex items-center justify-center font-black text-sm border border-white/15 shadow-inner shrink-0">
            <CalendarDays className="h-6 w-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Calendario de Ocupación
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-sky-300 border border-white/15">
                Campus Huancayo
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              {isResponsable
                ? 'Supervisión de ocupación y horarios de espacios universitarios'
                : 'Consulta los bloques ocupados y programa tu solicitud sin cruces de horario (07:00 a 22:00)'}
            </p>
          </div>
        </div>

        {/* CONTROLES DE FECHA Y BOTÓN CREAR */}
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <Tooltip content="Saltar a la fecha actual">
            <button
              type="button"
              onClick={handleIrAHoy}
              className="px-3.5 py-2 text-xs font-black rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer shadow-2xs"
            >
              Hoy
            </button>
          </Tooltip>

          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
            <Tooltip content="Mes anterior">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </Tooltip>

            <span className="text-xs font-bold text-white px-2 min-w-[130px] text-center capitalize">
              {currentMonth.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
            </span>

            <Tooltip content="Mes siguiente">
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {/* BOTÓN + CREAR */}
          {(isDocente || isAdmin) && (
            <Tooltip content="Registrar una nueva solicitud de espacio">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => {
                  setNuevaReserva((prev) => ({
                    ...prev,
                    fecha: selectedDate >= hoyStr ? selectedDate : hoyStr
                  }));
                  setModalReservaOpen(true);
                }}
                className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/20"
              >
                Solicitar Espacio
              </Button>
            </Tooltip>
          )}
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

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL IZQUIERDO: MINI CALENDARIO Y FILTRO */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* MINI CALENDARIO INTERACTIVO */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                {currentMonth.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 uppercase">
              <span>D</span>
              <span>L</span>
              <span>M</span>
              <span>M</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {miniCalendarDays.map((item, idx) => {
                if (!item.dateStr) {
                  return <div key={`empty-${idx}`} className="h-8 w-8"></div>;
                }

                const isToday = item.isToday;
                const isSelected = item.isSelected;
                const isPast = item.dateStr < hoyStr;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center font-bold transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#003366] text-white shadow-sm font-black'
                        : isToday
                        ? 'bg-blue-100 text-[#003366] font-black'
                        : isPast
                        ? 'text-slate-300 hover:bg-slate-50'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.dayNumber}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[11px] font-bold text-slate-500">
                Fecha seleccionada: <strong className="text-[#003366] font-mono">{selectedDate}</strong>
              </span>
            </div>
          </div>

          {/* FILTRO DE ESPACIOS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#003366]" />
                <span>Espacios Físicos</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setSelectedAmbienteIds(
                    selectedAmbienteIds.length === ambientes.length ? [] : ambientes.map((a) => a.id)
                  )
                }
                className="text-[11px] font-bold text-[#003366] hover:underline cursor-pointer"
              >
                {selectedAmbienteIds.length === ambientes.length ? 'Deseleccionar' : 'Todos'}
              </button>
            </div>

            <div className="space-y-2">
              {ambientes.map((amb, idx) => {
                const isChecked = selectedAmbienteIds.includes(amb.id);
                const colorDot = [
                  'bg-blue-600',
                  'bg-indigo-600',
                  'bg-sky-600',
                  'bg-amber-500',
                  'bg-rose-500',
                  'bg-purple-600'
                ][idx % 6];

                return (
                  <label
                    key={amb.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAmbienteFilter(amb.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#003366] focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorDot}`}></span>
                      <span className="text-xs font-bold text-slate-800 truncate group-hover:text-[#003366]">
                        {amb.nombre}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                      Cap: {amb.capacidad}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA AGENDA AGRUPADA POR DÍA */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Agenda de Espacios Programados
                </span>
                <span className="text-xs font-bold text-[#003366] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {reservasAgrupadasPorFecha.reduce((acc, g) => acc + g.items.length, 0)} turnos
                </span>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Visualizando a partir de: <strong className="font-mono text-slate-800">{selectedDate}</strong>
              </span>
            </div>

            {reservasAgrupadasPorFecha.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No hay reservas programadas para estos filtros
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Selecciona otra fecha en el mini calendario o haz clic en "+ Nueva Solicitud" para programar un laboratorio o auditorio.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reservasAgrupadasPorFecha.map((grupo) => (
                  <div key={grupo.fecha} className="p-4 sm:p-6 transition-colors hover:bg-slate-50/30">
                    
                    {/* ENCABEZADO DE DÍA */}
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-16 shrink-0 text-left">
                        <span
                          className={`text-xl font-black block leading-none ${
                            grupo.isToday ? 'text-[#003366]' : 'text-slate-800'
                          }`}
                        >
                          {grupo.diaNum}
                        </span>
                        <span className="text-[11px] font-black uppercase text-slate-400 mt-1 block tracking-wider">
                          {grupo.mesStr}, {grupo.diaSemanaStr}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center gap-2 pt-2">
                        {grupo.isToday && (
                          <div className="h-2 w-2 rounded-full bg-[#003366] animate-pulse"></div>
                        )}
                        <div
                          className={`h-0.5 flex-1 rounded-full ${
                            grupo.isToday ? 'bg-blue-300' : 'bg-slate-200'
                          }`}
                        ></div>
                        {grupo.isToday && (
                          <span className="text-[10px] font-black uppercase text-[#003366] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Hoy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LISTA DE EVENTOS / RESERVAS */}
                    <div className="pl-0 sm:pl-20 space-y-2.5">
                      {grupo.items.map((reserva) => {
                        const hInicio = reserva.horaInicio.slice(0, 5);
                        const hFin = reserva.horaFin.slice(0, 5);

                        const estadoDot = {
                          Aprobada: 'bg-[#003366] ring-4 ring-blue-100',
                          Pendiente: 'bg-amber-500 ring-4 ring-amber-100',
                          Rechazada: 'bg-rose-500 ring-4 ring-rose-100',
                          Cancelada: 'bg-slate-400 ring-4 ring-slate-100'
                        }[reserva.estado] || 'bg-[#003366] ring-4 ring-blue-100';

                        const estadoBadge = {
                          Aprobada: 'bg-blue-50 text-[#003366] border-blue-200',
                          Pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
                          Rechazada: 'bg-rose-50 text-rose-800 border-rose-200',
                          Cancelada: 'bg-slate-100 text-slate-600 border-slate-200'
                        }[reserva.estado] || 'bg-slate-100 text-slate-700 border-slate-200';

                        return (
                          <Tooltip content="Clic para consultar la información completa de la reserva" key={reserva.id}>
                            <div
                              onClick={() => setReservaDetalle(reserva)}
                              className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer gap-3 group text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${estadoDot}`}></div>

                                <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200">
                                  {hInicio} – {hFin}
                                </span>

                                <div className="truncate">
                                  <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#003366] transition-colors block truncate">
                                    {reserva.motivo}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                                    <span className="font-bold text-slate-700">
                                      {reserva.ambienteNombre}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">
                                      Docente: {reserva.usuarioNombre}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${estadoBadge}`}>
                                  {reserva.estado}
                                </span>
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETALLES DE RESERVA */}
      <BaseDialog.Root open={!!reservaDetalle} onOpenChange={(open) => !open && setReservaDetalle(null)}>
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
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <BaseDialog.Title className="text-lg font-black text-slate-900 m-0">
                  Detalle de Reserva Institucional
                </BaseDialog.Title>
                <BaseDialog.Description className="text-xs text-slate-500 m-0 mt-0.5">
                  Información oficial del turno programado en ReservaUPLA
                </BaseDialog.Description>
              </div>
            </div>

            {reservaDetalle && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Estado Actual:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        reservaDetalle.estado === 'Aprobada'
                          ? 'bg-blue-50 text-[#003366] border-blue-200'
                          : reservaDetalle.estado === 'Pendiente'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {reservaDetalle.estado}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Fecha Programada:</span>
                    <span className="font-mono font-bold text-slate-900">{reservaDetalle.fecha}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Horario Reservado:</span>
                    <span className="font-mono font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {reservaDetalle.horaInicio.slice(0, 5)} - {reservaDetalle.horaFin.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Espacio Universitario
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{reservaDetalle.ambienteNombre}</div>
                  <div className="text-xs text-slate-500">
                    {reservaDetalle.ambienteTipo} • {reservaDetalle.ambienteUbicacion}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Docente / Solicitante
                  </span>
                  <div className="font-bold text-slate-900">{reservaDetalle.usuarioNombre}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Código: {reservaDetalle.usuarioCodigo || 'DOC-UPLA'}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Motivo de la Actividad
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                    {reservaDetalle.motivo}
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

      {/* MODAL NUEVA SOLICITUD */}
      <BaseDialog.Root open={modalReservaOpen} onOpenChange={setModalReservaOpen}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-fadeIn" />
          <BaseDialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl max-w-lg w-[calc(100%-2rem)] p-6 sm:p-7 shadow-2xl border border-slate-100 outline-none">
            <BaseDialog.Close
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </BaseDialog.Close>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-2xl bg-[#003366] text-white flex items-center justify-center font-bold shrink-0">
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <BaseDialog.Title className="text-lg font-black text-slate-900 m-0">
                  Registrar Solicitud de Espacio
                </BaseDialog.Title>
                <BaseDialog.Description className="text-xs text-slate-500 m-0 mt-0.5">
                  Selecciona la fecha (hoy en adelante) y el turno horario.
                </BaseDialog.Description>
              </div>
            </div>

            <form onSubmit={handleCrearReserva} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Espacio Universitario <span className="text-rose-500">*</span>
                </label>
                <select
                  value={nuevaReserva.ambienteId}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, ambienteId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  required
                >
                  {ambientes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} — {a.tipo} (Cap: {a.capacidad})
                    </option>
                  ))}
                </select>
                {formErrors.ambienteId && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.ambienteId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de la Solicitud (Solo de hoy en adelante) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={hoyStr}
                  value={nuevaReserva.fecha}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, fecha: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-white"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Fechas pasadas están bloqueadas por regla de negocio (mínimo: <code className="font-bold text-[#003366]">{hoyStr}</code>).
                </p>
                {formErrors.fecha && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.fecha}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora Inicio <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nuevaReserva.horaInicio}
                    onChange={handleHoraInicioChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold font-mono text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    {timeOptions.slice(0, -1).map((t) => (
                      <option key={`ini-${t}`} value={t}>
                        {t} hrs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora Fin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nuevaReserva.horaFin}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, horaFin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold font-mono text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
                  >
                    {horaFinOptions.map((t) => (
                      <option key={`fin-${t}`} value={t}>
                        {t} hrs
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Solicitud <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={nuevaReserva.motivo}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, motivo: e.target.value })}
                  placeholder="Ejemplo: Clase práctica de laboratorio de Redes y Telecomunicaciones con 30 alumnos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-white resize-none"
                  required
                />
                {formErrors.motivo && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.motivo}</p>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                <strong>Aviso Institucional:</strong> Toda solicitud registrada queda en estado <strong>Pendiente</strong> hasta que el Administrador evalúe y confirme o rechace la solicitud.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalReservaOpen(false)}
                  disabled={guardandoReserva}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={guardandoReserva}>
                  Enviar Solicitud
                </Button>
              </div>
            </form>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </div>
  );
}
