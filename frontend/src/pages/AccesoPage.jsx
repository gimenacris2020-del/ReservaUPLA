import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  LogIn,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  CalendarDays,
  Clock,
  ShieldCheck,
  Building2,
  KeyRound
} from 'lucide-react';
import { Dialog as BaseDialog } from '@base-ui/react';
import { useAuth } from '../context/AuthContext';
import logoUpla from '../assets/logo-upla-blanco.png';
import campusUpla from '../assets/campus-upla.jpg';

export default function AccesoPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado del formulario
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Estados de interfaz y feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const origin = location.state?.from?.pathname || '/panel';
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleCodigoChange = (e) => {
    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCodigo(clean.slice(0, 10));
    if (errorMessage) setErrorMessage('');
  };

  const handleCodigoKeyDown = (e) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^[a-zA-Z0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const isCodigoLengthComplete = codigo.length >= 4;
  const isCodigoFormatValid = /^[A-Z0-9]{4,10}$/.test(codigo);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedCodigo = codigo.trim();

    if (!trimmedCodigo) {
      setErrorMessage('Por favor, ingresa tu código institucional.');
      return;
    }

    if (trimmedCodigo.length < 4 || trimmedCodigo.length > 10) {
      setErrorMessage('El código institucional debe contener entre 4 y 10 caracteres.');
      return;
    }

    const codigoRegex = /^[A-Z0-9]{4,10}$/;
    if (!codigoRegex.test(trimmedCodigo)) {
      setErrorMessage('El código debe contener únicamente letras y números.');
      return;
    }

    if (!contrasena) {
      setErrorMessage('Por favor, ingresa tu contraseña institucional.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(trimmedCodigo, contrasena, false);
      setSuccessMessage(`¡Bienvenido(a), ${user.nombreCompleto}! Accediendo...`);

      setTimeout(() => {
        let dest = '/panel';
        if (user.rol === 'Responsable de ambiente') {
          dest = '/calendario';
        } else if (user.rol === 'Solicitante') {
          dest = '/mis-solicitudes';
        }
        const origin = location.state?.from?.pathname || dest;
        navigate(origin, { replace: true });
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Credenciales incorrectas. Verifica tu código institucional y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-stretch font-sans text-slate-800">
      <div className="w-full flex flex-col lg:flex-row min-h-screen">
        
        {/* ========================================================
            PANEL IZQUIERDO: PROPORCIÓN 40% (Formulario de Acceso)
           ======================================================== */}
        <div className="w-full lg:w-[40%] xl:w-[38%] bg-white flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 shadow-2xl relative z-10">
          
          {/* Cabecera del Formulario */}
          <div>
            <div className="flex items-center gap-3.5 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-[#003366] p-2 flex items-center justify-center shadow-lg shadow-[#003366]/25 border border-blue-400/30">
                <img src={logoUpla} alt="Logo UPLA" className="h-full w-auto object-contain" />
              </div>
              <div>
                <span className="text-xs font-black text-[#003366] tracking-wider uppercase block">
                  Universidad Peruana Los Andes
                </span>
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Oficina de Informática y Sistemas
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Acceso al Sistema
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Ingresa con tu código institucional y contraseña para reservar y administrar ambientes universitarios.
              </p>
            </div>

            {/* Mensajes de Alerta */}
            {(errorMessage || successMessage) && (
              <div className="mb-4">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorMessage('')}
                      className="text-rose-400 hover:text-rose-700 cursor-pointer p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#003366] text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 text-[#003366] shrink-0" />
                    <span className="font-semibold">{successMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Campo Código Institucional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="codigo-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <span>Código Institucional</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#003366]">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="codigo-input"
                    type="text"
                    value={codigo}
                    onChange={handleCodigoChange}
                    onKeyDown={handleCodigoKeyDown}
                    maxLength={10}
                    placeholder="Código institucional"
                    autoComplete="username"
                    disabled={loading}
                    className={`block w-full rounded-xl border-2 bg-white py-3 pl-11 pr-10 text-sm font-bold font-mono tracking-wider uppercase text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal outline-none transition-all ${
                      isCodigoLengthComplete && isCodigoFormatValid
                        ? 'border-[#003366] focus:border-[#003366] focus:ring-4 focus:ring-blue-100'
                        : codigo.length > 0 && !isCodigoFormatValid
                        ? 'border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
                        : 'border-slate-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-100'
                    }`}
                  />
                  {codigo && (
                    <button
                      type="button"
                      onClick={() => setCodigo('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Borrar texto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="min-h-[18px] mt-1 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  {codigo.length === 0 ? (
                    <span>Código oficial asignado por la institución.</span>
                  ) : isCodigoLengthComplete && isCodigoFormatValid ? (
                    <span className="text-[#003366] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#003366]" />
                      Código válido ({codigo}).
                    </span>
                  ) : (
                    <span className="text-amber-700">Formato: Letras y números (4 a 10 dígitos).</span>
                  )}
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="contrasena-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <span>Contraseña</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                </div>

                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#003366]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="contrasena-input"
                    type={showPassword ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => {
                      setContrasena(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white py-3 pl-11 pr-11 text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#003366] focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-[#003366] cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Advertencia Bloq Mayús */}
                {capsLockActive && (
                  <div className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Bloq Mayús está activado</span>
                  </div>
                )}
              </div>

              {/* Botón Principal de Acceso en Azul UPLA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#003366] hover:bg-[#00264d] active:bg-[#001f3f] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#003366]/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 outline-none focus:ring-4 focus:ring-blue-400/30"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Ingresar a ReservaUPLA</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pie del Formulario */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="inline-flex items-center gap-1.5 font-bold text-[#003366] hover:underline cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Mesa de Ayuda OIS</span>
            </button>
            <span className="font-semibold text-slate-600">Universidad Peruana Los Andes</span>
          </div>
        </div>

        {/* ========================================================
            PANEL DERECHO: PROPORCIÓN 60% (Showcase ReservaUPLA)
           ======================================================== */}
        <div className="w-full lg:w-[60%] xl:w-[62%] relative p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white overflow-hidden bg-[#001f3f]">
          
          {/* Fotografía de Fondo con Overlay Azul Institucional UPLA */}
          <img
            src={campusUpla}
            alt="Campus Universidad Peruana Los Andes"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-60 contrast-110"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-[#001d3d]/95 via-[#002b49]/90 to-[#001428]/95 backdrop-blur-[2px]"></div>

          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Bloque Superior del Showcase */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-widest text-sky-200">
                Universidad Peruana Los Andes • Huancayo
              </span>
            </div>

            {/* Título Oficial del Sistema: ReservaUPLA */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-xl drop-shadow-md">
              ReservaUPLA
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-xl drop-shadow-sm">
              Plataforma tecnológica para la reserva, supervisión y auditoría en tiempo real de laboratorios de cómputo, auditorios y salas académicas de la UPLA.
            </p>
          </div>

          {/* Bloque Central: Widget Visual "Monitoreo en Vivo de Horarios" */}
          <div className="relative z-10 my-8 max-w-2xl bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-sky-200 tracking-wider">
                <CalendarDays className="h-4 w-4 text-sky-300" />
                <span>Agenda Activa del Campus • Hoy</span>
              </div>
              <span className="text-[10px] font-black uppercase bg-sky-500/30 text-sky-200 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                En Línea
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 text-[11px] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>08:00 - 10:00</span>
                </div>
                <div className="font-extrabold text-white text-xs truncate">Lab. Cómputo L-101</div>
                <div className="text-[10px] text-slate-300 truncate">Ingeniería de Sistemas</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 text-[11px] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>10:30 - 12:30</span>
                </div>
                <div className="font-extrabold text-white text-xs truncate">Auditorio Los Incas</div>
                <div className="text-[10px] text-slate-300 truncate">Conferencia Académica</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 text-[11px] font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>14:00 - 16:00</span>
                </div>
                <div className="font-extrabold text-white text-xs truncate">Sala de Sesiones</div>
                <div className="text-[10px] text-slate-300 truncate">Consejo de Facultad</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
                <span>Validación de turnos y prevención de cruces de horarios</span>
              </div>
              <span className="font-mono text-sky-200 font-bold">07:00 a 22:00 hrs</span>
            </div>
          </div>

          {/* Bloque Inferior: Slogan Institucional y Acreditación */}
          <div className="relative z-10 pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-200">
            <div>
              <p className="font-semibold text-white m-0">
                Universidad Peruana Los Andes — Huancayo • Chanchamayo
              </p>
              <p className="text-slate-300 text-[11px] m-0 mt-0.5">
                Oficina de Informática y Sistemas
              </p>
            </div>
            <div className="text-right text-[11px] text-sky-300 font-mono font-bold">
              Licenciada por SUNEDU
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ayuda */}
      <BaseDialog.Root open={showHelpModal} onOpenChange={setShowHelpModal}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-fadeIn" />
          <BaseDialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl max-w-lg w-[calc(100%-2rem)] p-6 sm:p-7 shadow-2xl border border-slate-100 outline-none">
            <BaseDialog.Close
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Cerrar ventana de ayuda"
            >
              <X className="h-5 w-5" />
            </BaseDialog.Close>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#003366] flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <BaseDialog.Title className="text-lg font-black text-slate-900 m-0">
                  Mesa de Ayuda Institucional
                </BaseDialog.Title>
                <BaseDialog.Description className="text-xs text-slate-500 m-0">
                  Asistencia para docentes y personal administrativo UPLA
                </BaseDialog.Description>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-extrabold text-slate-900">¿Cómo ingresar?</p>
                <p>
                  Para acceder utiliza tu código oficial de intranet UPLA y tu contraseña asignada institucionalmente.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800">Atención técnica:</p>
                <a
                  href="https://wa.me/51964256145?text=Hola,%20necesito%20asistencia%20con%20ReservaUPLA"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-[#003366] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[#003366] shrink-0" />
                    <span className="font-semibold">WhatsApp Soporte OIS</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#003366] bg-blue-100 px-2 py-0.5 rounded-full">
                    964256145
                  </span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </div>
  );
}
