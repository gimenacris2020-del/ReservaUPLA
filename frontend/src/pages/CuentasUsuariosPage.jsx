import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  X,
  UserX,
  UserCheck,
  Search,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Building2,
  Shield,
  Filter
} from 'lucide-react';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import SelectInput from '../components/ui/SelectInput';
import TableList from '../components/ui/TableList';
import AlertMessage from '../components/ui/AlertMessage';
import ModalConfirmacion from '../components/ui/ModalConfirmacion';
import Tooltip from '../components/ui/Tooltip';
import { usuarioService as usuarioApi } from '../service';

export default function CuentasUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal para confirmar deshabilitación / habilitación de usuario
  const [modalToggle, setModalToggle] = useState({
    isOpen: false,
    usuario: null,
    loading: false
  });

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombreCompleto: '',
    codigo: '',
    rol: 'Solicitante'
  });

  const [errores, setErrores] = useState({});

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await usuarioApi.obtenerTodos();
      setUsuarios(res);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al cargar los usuarios institucionales.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!nuevoUsuario.nombreCompleto.trim()) {
      errs.nombreCompleto = 'El nombre completo es obligatorio.';
    } else if (nuevoUsuario.nombreCompleto.trim().length < 3) {
      errs.nombreCompleto = 'El nombre debe tener al menos 3 caracteres.';
    }

    if (!nuevoUsuario.codigo.trim()) {
      errs.codigo = 'El código institucional es obligatorio.';
    } else if (!/^[A-Z][0-9]{5}[A-Z]$/.test(nuevoUsuario.codigo.trim())) {
      errs.codigo = 'Formato inválido: 1 letra inicial, 5 números y 1 letra final (Ej. Q01171J).';
    }

    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }

    try {
      setGuardando(true);
      setFeedback(null);
      await usuarioApi.registrar({
        nombreCompleto: nuevoUsuario.nombreCompleto.trim(),
        codigo: nuevoUsuario.codigo.trim().toUpperCase(),
        rol: nuevoUsuario.rol
      });

      setFeedback({
        type: 'success',
        title: 'Usuario Registrado',
        message: `El usuario "${nuevoUsuario.nombreCompleto}" fue registrado exitosamente con rol ${nuevoUsuario.rol}.`
      });

      setModalNuevoOpen(false);
      setNuevoUsuario({
        nombreCompleto: '',
        codigo: '',
        rol: 'Solicitante'
      });
      cargarUsuarios();
    } catch (err) {
      setFeedback({ type: 'error', title: 'Error al registrar usuario', message: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const handleAbrirConfirmacionToggle = (usuario) => {
    setModalToggle({
      isOpen: true,
      usuario,
      loading: false
    });
  };

  const handleConfirmarToggleActivo = async () => {
    const { usuario } = modalToggle;
    if (!usuario) return;

    try {
      setModalToggle((prev) => ({ ...prev, loading: true }));
      await usuarioApi.toggleActivo(usuario.id);
      await cargarUsuarios();

      const accionStr = usuario.activo ? 'deshabilitada' : 'reactivada';
      setFeedback({
        type: usuario.activo ? 'warning' : 'success',
        title: `Cuenta ${accionStr.toUpperCase()}`,
        message: usuario.activo
          ? `La cuenta del usuario "${usuario.nombreCompleto}" ha sido deshabilitada. No podrá acceder a la intranet hasta que sea rehabilitado.`
          : `La cuenta del usuario "${usuario.nombreCompleto}" ha sido reactivada con éxito.`
      });

      setModalToggle({ isOpen: false, usuario: null, loading: false });
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Error al actualizar acceso',
        message: err.message
      });
      setModalToggle((prev) => ({ ...prev, loading: false }));
    }
  };

  // Contadores de métricas por rol
  const totalCuentas = usuarios.length;
  const totalDocentes = usuarios.filter((u) => u.rol === 'Solicitante').length;
  const totalResponsables = usuarios.filter((u) => u.rol === 'Responsable de ambiente').length;
  const totalAdministradores = usuarios.filter((u) => u.rol === 'Administrador').length;

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusqueda =
        u.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.codigo && u.codigo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRol = filtroRol === 'Todos' || u.rol === filtroRol;

      return matchBusqueda && matchRol;
    });
  }, [usuarios, searchTerm, filtroRol]);

  const columnas = [
    {
      header: 'Usuario & Código',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-[#003366] flex items-center justify-center font-black text-sm shrink-0">
            {u.nombreCompleto?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm">{u.nombreCompleto}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {u.codigo || 'S/C'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Rol Institucional',
      render: (u) => {
        const config = {
          Administrador: {
            bg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
            icon: ShieldCheck
          },
          'Responsable de ambiente': {
            bg: 'bg-blue-50 text-[#003366] border-blue-200',
            icon: Building2
          },
          Solicitante: {
            bg: 'bg-slate-100 text-slate-800 border-slate-200',
            icon: GraduationCap
          }
        }[u.rol] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users };

        const Icon = config.icon;

        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${config.bg}`}>
            <Icon className="h-3.5 w-3.5" />
            <span>{u.rol === 'Solicitante' ? 'Docente' : u.rol}</span>
          </span>
        );
      }
    },
    {
      header: 'Reservas Totales',
      align: 'center',
      render: (u) => (
        <span className="font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-xs">
          {u.totalReservas ?? 0}
        </span>
      )
    },
    {
      header: 'Estado de Acceso',
      align: 'center',
      render: (u) => (
        <Tooltip content={u.activo ? 'Usuario con permiso de ingreso a la intranet' : 'Acceso bloqueado por el administrador'}>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
              u.activo
                ? 'bg-blue-50 text-[#003366] border-blue-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {u.activo ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#003366]" />
                <span>Activo</span>
              </>
            ) : (
              <>
                <UserX className="h-3.5 w-3.5 text-rose-600" />
                <span>Deshabilitado</span>
              </>
            )}
          </span>
        </Tooltip>
      )
    },
    {
      header: 'Gestión',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end">
          {u.activo ? (
            <Tooltip content="Deshabilitar acceso temporal sin borrar historial">
              <Button
                variant="outline"
                size="sm"
                icon={UserX}
                onClick={() => handleAbrirConfirmacionToggle(u)}
                className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold"
              >
                Deshabilitar
              </Button>
            </Tooltip>
          ) : (
            <Tooltip content="Reactivar acceso a la plataforma">
              <Button
                variant="outline"
                size="sm"
                icon={UserCheck}
                onClick={() => handleAbrirConfirmacionToggle(u)}
                className="text-[#003366] border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-bold"
              >
                Reactivar
              </Button>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <Users className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Gestión de Accesos y Seguridad</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Directorio Institucional de Usuarios</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
              Control de credenciales, roles institucionales y privilegios de acceso para docentes, responsables y administradores (RF-01).
            </p>
          </div>

          <Button
            variant="primary"
            icon={UserPlus}
            size="md"
            onClick={() => setModalNuevoOpen(true)}
            className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/20"
          >
            Registrar Usuario
          </Button>
        </div>
      </div>

      {/* FRANJA CONSOLIDADA DE AUDITORÍA DE ROLES */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 text-[#003366] flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Comunidad Académica Registrada
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {totalCuentas} usuarios activos
            </span>
          </div>
        </div>

        {/* CONTADORES POR ROL INTEGRADOS EN PILLS */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700">
            <GraduationCap className="h-4 w-4 text-[#003366]" />
            <span>Docentes: <strong className="text-slate-900 font-mono">{totalDocentes}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs font-bold text-blue-900">
            <Building2 className="h-4 w-4 text-[#003366]" />
            <span>Responsables: <strong className="text-[#003366] font-mono">{totalResponsables}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs font-bold text-indigo-900">
            <ShieldCheck className="h-4 w-4 text-indigo-700" />
            <span>Admins: <strong className="text-indigo-900 font-mono">{totalAdministradores}</strong></span>
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

      {/* Barra de Filtros y Búsqueda Moderna con Segmentos */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#003366] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Segmented Buttons para Roles */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'Todos', label: 'Todos' },
            { id: 'Solicitante', label: 'Docentes' },
            { id: 'Responsable de ambiente', label: 'Responsables' },
            { id: 'Administrador', label: 'Admins' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltroRol(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroRol === item.id
                  ? 'bg-[#003366] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de usuarios */}
      <TableList
        columns={columnas}
        data={usuariosFiltrados}
        loading={loading}
        emptyMessage="No se encontraron usuarios que coincidan con los filtros aplicados."
      />

      {/* Modal Confirmación de Deshabilitar / Habilitar */}
      <ModalConfirmacion
        isOpen={modalToggle.isOpen}
        title={
          modalToggle.usuario?.activo
            ? '¿Deshabilitar acceso del usuario?'
            : '¿Reactivar acceso del usuario?'
        }
        message={
          modalToggle.usuario?.activo
            ? `Estás a punto de deshabilitar el acceso de "${modalToggle.usuario?.nombreCompleto}" (${modalToggle.usuario?.codigo || 'Docente'}). El usuario no podrá iniciar sesión en ReservaUPLA, pero sus solicitudes históricas se conservarán intactas.`
            : `Estás a punto de reactivar el acceso de "${modalToggle.usuario?.nombreCompleto}". El usuario podrá volver a ingresar y gestionar solicitudes de espacios normalmente.`
        }
        confirmText={
          modalToggle.usuario?.activo
            ? 'Sí, deshabilitar acceso'
            : 'Sí, reactivar acceso'
        }
        cancelText="Cancelar"
        variant={modalToggle.usuario?.activo ? 'danger' : 'success'}
        onConfirm={handleConfirmarToggleActivo}
        onCancel={() => setModalToggle({ isOpen: false, usuario: null, loading: false })}
      />

      {/* Modal Registrar Nuevo Usuario */}
      {modalNuevoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#003366]" />
                <span>Registrar Usuario Institucional</span>
              </h3>
              <button
                onClick={() => setModalNuevoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              <TextInput
                label="Nombre Completo"
                name="nombreCompleto"
                value={nuevoUsuario.nombreCompleto}
                onChange={handleInputChange}
                placeholder="Ejemplo: Dra. Carmen Morales Vega"
                error={errores.nombreCompleto}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  label="Código Institucional"
                  name="codigo"
                  value={nuevoUsuario.codigo}
                  onChange={(e) => {
                    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setNuevoUsuario((prev) => ({ ...prev, codigo: clean.slice(0, 7) }));
                    if (errores.codigo) setErrores((prev) => ({ ...prev, codigo: null }));
                  }}
                  placeholder="Ej. Q01171J"
                  helper="1 letra + 5 números + 1 letra"
                  error={errores.codigo}
                  required
                />

                <SelectInput
                  label="Rol Institucional"
                  name="rol"
                  value={nuevoUsuario.rol}
                  onChange={handleInputChange}
                  options={[
                    { value: 'Solicitante', label: 'Docente (Solicitante)' },
                    { value: 'Responsable de ambiente', label: 'Responsable de Ambiente' },
                    { value: 'Administrador', label: 'Administrador General' }
                  ]}
                  required
                />
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#003366] shrink-0" />
                  <span>Acceso Institucional Directo:</span>
                </p>
                <p className="text-blue-800">
                  El usuario podrá ingresar de inmediato utilizando su <strong>código institucional</strong> y la contraseña institucional establecida.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalNuevoOpen(false)}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" loading={guardando} className="font-bold">
                  Registrar Usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
