using ReservaUPLA.Application.DTOs.Dashboard;
using ReservaUPLA.Application.DTOs.Reserva;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IReservaRepository _reservaRepositorio;
    private readonly IAmbienteRepository _ambienteRepositorio;
    private readonly IUsuarioRepository _usuarioRepositorio;

    public DashboardService(
        IReservaRepository reservaRepository,
        IAmbienteRepository ambienteRepository,
        IUsuarioRepository usuarioRepository)
    {
        _reservaRepositorio = reservaRepository;
        _ambienteRepositorio = ambienteRepository;
        _usuarioRepositorio = usuarioRepository;
    }

    public async Task<DashboardIndicadoresDto> ObtenerIndicadoresAsync()
    {
        var totalReservas = await _reservaRepositorio.CountAsync();
        var totalPendientes = await _reservaRepositorio.CountAsync("Pendiente");
        var totalAprobadas = await _reservaRepositorio.CountAsync("Aprobada");
        var totalRechazadas = await _reservaRepositorio.CountAsync("Rechazada");
        var totalCanceladas = await _reservaRepositorio.CountAsync("Cancelada");

        var totalAmbientes = await _ambienteRepositorio.CountAsync();
        var ambientesDisponibles = await _ambienteRepositorio.CountAsync("Disponible");
        var totalUsuariosActivos = await _usuarioRepositorio.CountAsync(true);

        // Indicador: Ambiente con mayor demanda
        var espacioTop = await _reservaRepositorio.GetAmbienteMasUtilizadoAsync();

        // Métricas de uso por ambiente
        var datosUsoAmbientes = await _reservaRepositorio.GetUsoPorAmbienteAsync(8);
        var metricasUso = datosUsoAmbientes.Select(item => new AmbienteUsoMetricaDto
        {
            AmbienteId = item.AmbienteId,
            Nombre = item.Nombre,
            Tipo = item.Tipo,
            TotalReservas = item.TotalReservas,
            Aprobadas = item.Aprobadas
        }).ToList();

        // Próximas reservas
        var listaProximas = await _reservaRepositorio.GetProximasReservasAsync(5);
        var proximasDtos = listaProximas.Select(r => ReservaService.ConvertirADto(r)).ToList();

        return new DashboardIndicadoresDto
        {
            TotalReservas = totalReservas,
            ReservasPendientes = totalPendientes,
            ReservasAprobadas = totalAprobadas,
            ReservasRechazadas = totalRechazadas,
            ReservasCanceladas = totalCanceladas,
            TotalAmbientes = totalAmbientes,
            AmbientesDisponibles = ambientesDisponibles,
            TotalUsuarios = totalUsuariosActivos,
            AmbienteMasUtilizadoNombre = (espacioTop.Total > 0) ? espacioTop.Nombre : "Sin reservas registradas aún",
            AmbienteMasUtilizadoTotal = espacioTop.Total,
            AmbienteMasUtilizadoTipo = (espacioTop.Total > 0) ? espacioTop.Tipo : string.Empty,
            UsoPorAmbiente = metricasUso,
            ProximasReservas = proximasDtos
        };
    }
}
