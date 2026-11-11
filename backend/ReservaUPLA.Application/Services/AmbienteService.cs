using ReservaUPLA.Application.Common.Exceptions;
using ReservaUPLA.Application.DTOs.Ambiente;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Services;

public class AmbienteService : IAmbienteService
{
    private readonly IAmbienteRepository _ambienteRepositorio;
    private readonly IReservaRepository _reservaRepositorio;

    public AmbienteService(IAmbienteRepository ambienteRepository, IReservaRepository reservaRepository)
    {
        _ambienteRepositorio = ambienteRepository;
        _reservaRepositorio = reservaRepository;
    }

    public async Task<IEnumerable<AmbienteDto>> ObtenerTodosAsync(string? tipo = null, string? estado = null)
    {
        var ambientes = await _ambienteRepositorio.GetAllAsync(tipo, estado);
        var listaDtos = new List<AmbienteDto>();

        foreach (var entidad in ambientes)
        {
            var conteoReservas = await _reservaRepositorio.CountByAmbienteIdAsync(entidad.Id);
            listaDtos.Add(ConvertirADto(entidad, conteoReservas));
        }

        return listaDtos;
    }

    public async Task<AmbienteDto> ObtenerPorIdAsync(Guid id)
    {
        var entidadAmbiente = await _ambienteRepositorio.GetByIdAsync(id);
        if (entidadAmbiente == null)
        {
            throw new NotFoundException($"No se encontró el ambiente con Id {id}.");
        }

        var total = await _reservaRepositorio.CountByAmbienteIdAsync(id);
        return ConvertirADto(entidadAmbiente, total);
    }

    public async Task<AmbienteDto> RegistrarAmbienteAsync(AmbienteCreateDto dto)
    {
        var nombreTrim = dto.Nombre.Trim();
        if (await _ambienteRepositorio.ExistsNombreAsync(nombreTrim))
        {
            throw new BusinessRuleException($"Ya existe un ambiente registrado con el nombre '{dto.Nombre}'.");
        }

        var tipoNormalizado = NormalizarTipo(dto.Tipo);
        var estadoNormalizado = NormalizarEstado(dto.Estado);

        var nuevoAmbiente = new Ambiente
        {
            Id = Guid.NewGuid(),
            Nombre = nombreTrim,
            Tipo = tipoNormalizado,
            Capacidad = dto.Capacidad,
            Ubicacion = dto.Ubicacion.Trim(),
            Estado = estadoNormalizado
        };

        var entidadCreada = await _ambienteRepositorio.AddAsync(nuevoAmbiente);
        return ConvertirADto(entidadCreada, 0);
    }

    public async Task<AmbienteDto> ActualizarAmbienteAsync(Guid id, AmbienteUpdateDto dto)
    {
        var ambiente = await _ambienteRepositorio.GetByIdAsync(id);
        if (ambiente == null)
        {
            throw new NotFoundException($"No se encontró el ambiente con Id {id}.");
        }

        var nombreTrim = dto.Nombre.Trim();
        if (await _ambienteRepositorio.ExistsNombreAsync(nombreTrim, id))
        {
            throw new BusinessRuleException($"Ya existe otro ambiente con el nombre '{dto.Nombre}'.");
        }

        ambiente.Nombre = nombreTrim;
        ambiente.Tipo = NormalizarTipo(dto.Tipo);
        ambiente.Capacidad = dto.Capacidad;
        ambiente.Ubicacion = dto.Ubicacion.Trim();
        ambiente.Estado = NormalizarEstado(dto.Estado);

        await _ambienteRepositorio.UpdateAsync(ambiente);
        var total = await _reservaRepositorio.CountByAmbienteIdAsync(id);
        return ConvertirADto(ambiente, total);
    }

    public async Task<AmbienteDto> CambiarEstadoAsync(Guid id, string nuevoEstado)
    {
        var ambiente = await _ambienteRepositorio.GetByIdAsync(id);
        if (ambiente == null)
        {
            throw new NotFoundException($"No se encontró el ambiente con Id {id}.");
        }

        ambiente.Estado = NormalizarEstado(nuevoEstado);
        await _ambienteRepositorio.UpdateAsync(ambiente);

        var total = await _reservaRepositorio.CountByAmbienteIdAsync(id);
        return ConvertirADto(ambiente, total);
    }

    public Task<IEnumerable<string>> ObtenerTiposAsync()
    {
        IEnumerable<string> catalogoTipos = new[]
        {
            "Laboratorio de Cómputo",
            "Laboratorio Especializado",
            "Auditorio",
            "Sala de Reuniones"
        };
        return Task.FromResult(catalogoTipos);
    }

    public Task<IEnumerable<string>> ObtenerEstadosAsync()
    {
        IEnumerable<string> catalogoEstados = new[]
        {
            "Disponible",
            "En Mantenimiento",
            "No Disponible"
        };
        return Task.FromResult(catalogoEstados);
    }

    public static AmbienteDto ConvertirADto(Ambiente a, int totalReservas = 0)
    {
        return new AmbienteDto
        {
            Id = a.Id,
            Nombre = a.Nombre,
            Tipo = a.Tipo,
            Capacidad = a.Capacidad,
            Ubicacion = a.Ubicacion,
            Estado = a.Estado,
            TotalReservas = totalReservas
        };
    }

    public static AmbienteDto MapearADto(Ambiente a, int totalReservas = 0) => ConvertirADto(a, totalReservas);

    public static string NormalizarTipo(string? tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo)) return "Laboratorio de Cómputo";
        var normalizado = tipo.Replace(" ", "").Replace("ó", "o").Replace("é", "e").ToLowerInvariant();
        return normalizado switch
        {
            "auditorio" => "Auditorio",
            "salareuniones" => "Sala de Reuniones",
            "laboratorioespecializado" => "Laboratorio Especializado",
            _ => "Laboratorio de Cómputo"
        };
    }

    public static string NormalizarEstado(string? estado)
    {
        if (string.IsNullOrWhiteSpace(estado)) return "Disponible";
        var normalizado = estado.Replace(" ", "").ToLowerInvariant();
        return normalizado switch
        {
            "mantenimiento" or "enmantenimiento" => "En Mantenimiento",
            "inactivo" or "nodisponible" => "No Disponible",
            _ => "Disponible"
        };
    }

    public static string FormatearTipo(string tipo) => NormalizarTipo(tipo);
    public static string FormatearEstado(string estado) => NormalizarEstado(estado);
}
