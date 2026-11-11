import { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  RefreshCw,
  Download,
  CalendarDays
} from 'lucide-react';
import Button from '../components/ui/Button';
import AlertMessage from '../components/ui/AlertMessage';
import Tooltip from '../components/ui/Tooltip';
import DateInput from '../components/ui/DateInput';
import SelectInput from '../components/ui/SelectInput';
import { reservationService, roomService } from '../service';

export default function EstadisticasPage() {
  const hoyStr = new Date().toISOString().split('T')[0];

  // Filtros de reporte
  const [fechaDesde, setFechaDesde] = useState(hoyStr);
  const [fechaHasta, setFechaHasta] = useState(hoyStr);
  const [filtroAmbiente, setFiltroAmbiente] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  // Datos
  const [reservas, setReservas] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Cargar ambientes y reservas iniciales
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const rooms = await roomService.getAll();
        setAmbientes(rooms);
      } catch (err) {
        console.error('Error cargando ambientes para estadísticas:', err);
      }
    };
    cargarCatalogos();
  }, []);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const data = await reservationService.getAll();
      setReservas(data);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Error al consultar datos',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  // Botones de filtro rápido de fechas
  const setRangoRapido = (tipo) => {
    const d = new Date();
    const hoy = d.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      setFechaDesde(hoy);
      setFechaHasta(hoy);
    } else if (tipo === 'semana') {
      const primerDia = new Date(d);
      primerDia.setDate(d.getDate() - d.getDay() + 1);
      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6);
      setFechaDesde(primerDia.toISOString().split('T')[0]);
      setFechaHasta(ultimoDia.toISOString().split('T')[0]);
    } else if (tipo === 'mes') {
      const primerDia = new Date(d.getFullYear(), d.getMonth(), 1);
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      setFechaDesde(primerDia.toISOString().split('T')[0]);
      setFechaHasta(ultimoDia.toISOString().split('T')[0]);
    } else if (tipo === 'todos') {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  // Filtrado de las reservas en memoria
  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      if (fechaDesde && r.fecha < fechaDesde) return false;
      if (fechaHasta && r.fecha > fechaHasta) return false;
      if (filtroAmbiente !== 'Todos' && r.ambienteId !== filtroAmbiente) return false;
      if (filtroEstado !== 'Todas' && r.estado !== filtroEstado) return false;
      return true;
    }).sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [reservas, fechaDesde, fechaHasta, filtroAmbiente, filtroEstado]);

  // Cálculo de indicadores
  const resumenReporte = useMemo(() => {
    const total = reservasFiltradas.length;
    const aprobadas = reservasFiltradas.filter((r) => r.estado === 'Aprobada').length;
    const pendientes = reservasFiltradas.filter((r) => r.estado === 'Pendiente').length;
    const rechazadas = reservasFiltradas.filter((r) => r.estado === 'Rechazada').length;

    let horasOcupadas = 0;
    reservasFiltradas
      .filter((r) => r.estado === 'Aprobada')
      .forEach((r) => {
        const [hI, mI] = r.horaInicio.split(':').map(Number);
        const [hF, mF] = r.horaFin.split(':').map(Number);
        const diff = (hF * 60 + mF - (hI * 60 + mI)) / 60;
        if (diff > 0) horasOcupadas += diff;
      });

    return { total, aprobadas, pendientes, rechazadas, horasOcupadas };
  }, [reservasFiltradas]);

  // Exportar a CSV con codificación UTF-8 BOM
  const handleExportarCSV = () => {
    if (reservasFiltradas.length === 0) {
      setFeedback({
        type: 'warning',
        title: 'Sin datos para exportar',
        message: 'No existen registros para el rango de fechas y filtros seleccionados.'
      });
      return;
    }

    const headers = [
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Horario Ocupado',
      'Espacio Universitario',
      'Tipo de Espacio',
      'Ubicación',
      'Código Solicitante',
      'Nombre del Solicitante',
      'Correo',
      'Motivo de la Solicitud',
      'Estado'
    ];

    const rows = reservasFiltradas.map((r) => {
      const hInicio = r.horaInicio.slice(0, 5);
      const hFin = r.horaFin.slice(0, 5);
      return [
        r.fecha,
        hInicio,
        hFin,
        `"${hInicio} - ${hFin}"`,
        `"${(r.ambienteNombre || '').replace(/"/g, '""')}"`,
        `"${(r.ambienteTipo || '').replace(/"/g, '""')}"`,
        `"${(r.ambienteUbicacion || '').replace(/"/g, '""')}"`,
        `"${r.usuarioCodigo || ''}"`,
        `"${(r.usuarioNombre || '').replace(/"/g, '""')}"`,
        `"${r.usuarioCorreo || ''}"`,
        `"${(r.motivo || '').replace(/"/g, '""')}"`,
        r.estado
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fechaNombre = fechaDesde ? `${fechaDesde}_a_${fechaHasta || fechaDesde}` : 'Historico';
    link.setAttribute('download', `Estadisticas_Ocupacion_Espacios_UPLA_${fechaNombre}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CABECERA EJECUTIVA GIMENA: HERO BANNER INSTITUCIONAL */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white p-6 sm:p-7 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/15">
              <FileSpreadsheet className="h-3.5 w-3.5 text-sky-300" />
              <span>Campus Huancayo • Métricas y Reportes Institucionales</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Métricas e Informes de Ocupación</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
              Consolidado de reservas y horarios de infraestructura. Exportación formal a <strong>Excel (CSV)</strong> e <strong>impresión con membrete institucional</strong> (RF-08).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Tooltip content="Imprimir reporte formal con membrete UPLA o guardar como PDF">
              <Button
                variant="outline"
                icon={Printer}
                size="md"
                onClick={handleImprimir}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold"
              >
                Imprimir / PDF
              </Button>
            </Tooltip>

            <Tooltip content="Descargar archivo .CSV compatible con Microsoft Excel">
              <Button
                variant="primary"
                icon={Download}
                size="md"
                onClick={handleExportarCSV}
                className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black shadow-md shadow-sky-400/20"
              >
                Descargar Excel (CSV)
              </Button>
            </Tooltip>
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

      {/* PANEL DE FILTROS CON ALINEACIÓN PERFECTA */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider">
            <Filter className="h-4 w-4 text-[#003366]" />
            <span>Criterios de Filtrado de Ocupación</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setRangoRapido('hoy')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setRangoRapido('semana')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setRangoRapido('mes')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setRangoRapido('todos')}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Histórico Completo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <DateInput
            label="Fecha Desde"
            name="fechaDesde"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />

          <DateInput
            label="Fecha Hasta"
            name="fechaHasta"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />

          <SelectInput
            label="Espacio Universitario"
            name="filtroAmbiente"
            value={filtroAmbiente}
            onChange={(e) => setFiltroAmbiente(e.target.value)}
            options={[
              { value: 'Todos', label: 'Todos los Espacios' },
              ...ambientes.map((amb) => ({ value: amb.id, label: `${amb.nombre} (${amb.tipo})` }))
            ]}
          />

          <SelectInput
            label="Estado de la Solicitud"
            name="filtroEstado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            options={[
              { value: 'Todas', label: 'Todos los Estados' },
              { value: 'Aprobada', label: 'Aprobadas (Horarios Confirmados)' },
              { value: 'Pendiente', label: 'Pendientes de Revisión' },
              { value: 'Rechazada', label: 'Rechazadas' }
            ]}
          />
        </div>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Registros Filtrados
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {resumenReporte.total}
          </span>
        </div>

        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-[11px] font-bold text-[#003366] uppercase tracking-wider block">
            Aprobadas (Confirmadas)
          </span>
          <span className="text-2xl font-black text-[#003366] mt-1 block">
            {resumenReporte.aprobadas}
          </span>
        </div>

        <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 shadow-2xs">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider block">
            Horas Ocupadas
          </span>
          <span className="text-2xl font-black text-teal-800 mt-1 block">
            {resumenReporte.horasOcupadas} hrs
          </span>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Pendientes
          </span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">
            {resumenReporte.pendientes}
          </span>
        </div>
      </div>

      {/* VISTA PREVIA IMPRESA Y EN PANTALLA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden print:block p-6 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black uppercase text-slate-900">
                UNIVERSIDAD PERUANA LOS ANDES
              </h1>
              <p className="text-xs font-bold text-slate-600">
                Oficina de Informática y Sistemas • Sistema ReservaUPLA
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Reporte de Horarios de Ocupación y Control de Reservas
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Fecha de emisión: {new Date().toLocaleDateString('es-PE')}</p>
              <p>Rango: {fechaDesde || 'Inicio'} al {fechaHasta || 'Fin'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            Bitácora de Horarios de Ocupación ({reservasFiltradas.length} resultados)
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={cargarReservas}
            loading={loading}
            className="text-xs font-bold text-slate-600 print:hidden"
          >
            Actualizar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Horario Ocupado</th>
                <th className="py-3 px-4">Espacio</th>
                <th className="py-3 px-4">Docente / Solicitante</th>
                <th className="py-3 px-4">Motivo Institucional</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    No se encontraron registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((r) => {
                  const estadoBadge = {
                    Aprobada: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    Pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
                    Rechazada: 'bg-rose-50 text-rose-800 border-rose-200',
                    Cancelada: 'bg-slate-100 text-slate-600 border-slate-200'
                  }[r.estado] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.fecha}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          {r.horaInicio.slice(0, 5)} - {r.horaFin.slice(0, 5)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.ambienteNombre}</div>
                        <div className="text-[10px] text-slate-500">{r.ambienteTipo} • {r.ambienteUbicacion}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{r.usuarioNombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {r.usuarioCodigo || 'DOC-UPLA'} • {r.usuarioCorreo}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={r.motivo}>
                        {r.motivo}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black border ${estadoBadge}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden print:flex justify-between items-center p-6 border-t border-slate-300 mt-8 text-xs text-slate-500">
          <div>
            <p>Generado por: Administrador General del Sistema</p>
            <p>Universidad Peruana Los Andes — Intranet</p>
          </div>
          <div className="border-t border-slate-400 w-48 text-center pt-1 text-slate-600 font-bold">
            Firma / Sello Responsable
          </div>
        </div>
      </div>
    </div>
  );
}
