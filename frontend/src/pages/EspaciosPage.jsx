import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Users,
  MapPin,
  X,
  Search,
  Monitor,
  Laptop,
  CheckCircle2,
  Wrench,
  Wifi,
  Sparkles,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import SelectInput from '../components/ui/SelectInput';
import AlertMessage from '../components/ui/AlertMessage';
import { ambienteService as ambienteApi } from '../service';

export default function EspaciosPage() {
  const [ambientes, setAmbientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros interactivos del catálogo
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [busquedaTexto, setBusquedaTexto] = useState('');

  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [nuevoAmbiente, setNuevoAmbiente] = useState({
    nombre: '',
    tipo: 'Laboratorio de Cómputo',
    capacidad: 30,
    ubicacion: '',
    estado: 'Disponible'
  });

  const [errores, setErrores] = useState({});

  const cargarAmbientes = async () => {
    try {
      setLoading(true);
      const [ambData, tiposData, estadosData] = await Promise.all([
        ambienteApi.obtenerTodos(),
        ambienteApi.obtenerTipos(),
        ambienteApi.obtenerEstados()
      ]);
      setAmbientes(ambData);
      setTipos(tiposData);
      setEstados(estadosData);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar espacios.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAmbientes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoAmbiente((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleGuardarAmbiente = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!nuevoAmbiente.nombre.trim()) errs.nombre = 'El nombre del espacio es obligatorio.';
    if (!nuevoAmbiente.ubicacion.trim()) errs.ubicacion = 'La ubicación física es obligatoria.';
    if (!nuevoAmbiente.capacidad || Number(nuevoAmbiente.capacidad) <= 0) {
      errs.capacidad = 'La capacidad debe ser mayor que 0.';
    }

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    try {
      setGuardando(true);
      setFeedback(null);
      await ambienteApi.registrar({
        nombre: nuevoAmbiente.nombre.trim(),
        tipo: nuevoAmbiente.tipo,
        capacidad: parseInt(nuevoAmbiente.capacidad, 10),
        ubicacion: nuevoAmbiente.ubicacion.trim(),
        estado: nuevoAmbiente.estado
      });

      setFeedback({
        type: 'success',
        title: 'Espacio Registrado',
        message: `El espacio "${nuevoAmbiente.nombre}" fue registrado correctamente.`
      });

      setModalNuevoOpen(false);
      setNuevoAmbiente({
        nombre: '',
        tipo: tipos[0] || 'Laboratorio de Cómputo',
        capacidad: 30,
        ubicacion: '',
        estado: 'Disponible'
      });
      cargarAmbientes();
    } catch (err) {
      setFeedback({ type: 'error', title: 'Error al registrar', message: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (id, estadoActual) => {
    const nuevo = estadoActual === 'Disponible' ? 'En Mantenimiento' : 'Disponible';
    try {
      await ambienteApi.cambiarEstado(id, nuevo);
      cargarAmbientes();
      setFeedback({
        type: 'info',
        message: `Estado de espacio actualizado a "${nuevo}".`
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Filtrado reactivo en memoria
  const ambientesFiltrados = useMemo(() => {
    return ambientes.filter((amb) => {
      const matchTipo = filtroTipo === 'Todos' || amb.tipo === filtroTipo;
      const matchTexto =
        !busquedaTexto ||
        amb.nombre.toLowerCase().includes(busquedaTexto.toLowerCase()) ||
        amb.ubicacion.toLowerCase().includes(busquedaTexto.toLowerCase());
      return matchTipo && matchTexto;
    });
  }, [ambientes, filtroTipo, busquedaTexto]);

  const getTipoIcon = (tipo) => {
    if (tipo?.toLowerCase().includes('laboratorio')) return Laptop;
    if (tipo?.toLowerCase().includes('auditorio')) return Sparkles;
    return Users;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* 1. CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <Building2 className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Gestión de Infraestructura</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Catálogo de Espacios Universitarios</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
              Laboratorios, auditorios y salas institucionales acondicionadas con aforo y equipamiento verificado (RF-02).
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            size="md"
            onClick={() => setModalNuevoOpen(true)}
            className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/20"
          >
            Registrar Espacio
          </Button>
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

      {/* 2. BARRA DE FILTROS Y SEGMENTACIÓN POR TIPO (NUEVA ESTRUCTURA) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Pestañas de Filtro Rápido */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['Todos', 'Laboratorio de Cómputo', 'Auditorio', 'Sala de Reuniones'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filtroTipo === t
                  ? 'bg-[#003366] text-white shadow-sm shadow-[#003366]/20 font-black'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {t === 'Todos' ? `Todos (${ambientes.length})` : t}
            </button>
          ))}
        </div>

        {/* Buscador Integrado */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            placeholder="Buscar por nombre o pabellón..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100 bg-slate-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3. GRID DE ESPACIOS: NUEVA FORMA DE CARDS CON FORMATO ARQUITECTÓNICO */}
      {loading ? (
        <div className="py-14 text-center text-slate-400">
          <svg className="animate-spin h-7 w-7 text-[#003366] mx-auto mb-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-xs font-bold text-slate-600">Cargando espacios del campus...</span>
        </div>
      ) : ambientesFiltrados.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No se encontraron espacios coincidentes</h3>
          <p className="text-xs text-slate-400 mt-1">Pruebe seleccionando otra categoría o borre el texto de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ambientesFiltrados.map((amb) => {
            const isDisponible = amb.estado === 'Disponible';
            const Icon = getTipoIcon(amb.tipo);

            return (
              <div
                key={amb.id}
                className="group rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* FRANJA SUPERIOR DISTINTIVA */}
                <div className="p-5 pb-4 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#003366] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                        {amb.tipo}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isDisponible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isDisponible ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{amb.estado}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#003366] transition-colors leading-snug">
                      {amb.nombre}
                    </h3>

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{amb.ubicacion}</span>
                    </div>
                  </div>

                  {/* BLOQUE DE CAPACIDAD Y EQUIPAMIENTO */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <Users className="h-3.5 w-3.5 text-[#003366]" />
                      <span>Aforo: {amb.capacidad} personas</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Wifi className="h-3.5 w-3.5" title="Red Wi-Fi UPLA" />
                      <Laptop className="h-3.5 w-3.5" title="Equipamiento multimedia" />
                    </div>
                  </div>
                </div>

                {/* PIE DE TARJETA CON BOTÓN DE GESTIÓN */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {amb.totalReservas} solicitudes tramitadas
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCambiarEstado(amb.id, amb.estado)}
                    className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      isDisponible
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <Wrench className="h-3 w-3" />
                    <span>{isDisponible ? 'Mantenimiento' : 'Habilitar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO ESPACIO */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#003366]" />
                Registrar Nuevo Espacio Universitario
              </h3>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarAmbiente} className="space-y-4">
              <TextInput
                label="Nombre del Espacio"
                name="nombre"
                value={nuevoAmbiente.nombre}
                onChange={handleInputChange}
                placeholder="Ejemplo: Laboratorio Especializado de Robótica"
                error={errores.nombre}
                required
              />

              <SelectInput
                label="Tipo Institucional"
                name="tipo"
                value={nuevoAmbiente.tipo}
                onChange={handleInputChange}
                options={tipos.map((t) => ({ value: t, label: t }))}
                required
              />

              <div className="grid grid-cols-2 gap-3 items-start">
                <TextInput
                  label="Capacidad"
                  name="capacidad"
                  type="number"
                  value={nuevoAmbiente.capacidad}
                  onChange={handleInputChange}
                  error={errores.capacidad}
                  required
                />

                <SelectInput
                  label="Estado Inicial"
                  name="estado"
                  value={nuevoAmbiente.estado}
                  onChange={handleInputChange}
                  options={estados.map((e) => ({ value: e, label: e }))}
                  required
                />
              </div>

              <TextInput
                label="Ubicación Física"
                name="ubicacion"
                value={nuevoAmbiente.ubicacion}
                onChange={handleInputChange}
                placeholder="Ejemplo: Pabellón C - 3er Piso"
                error={errores.ubicacion}
                required
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalNuevoOpen(false)}
                  disabled={guardando}
                  className="font-bold text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={guardando}
                  className="font-bold bg-[#003366] text-white shadow-md shadow-[#003366]/20 px-5"
                >
                  Guardar Espacio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
