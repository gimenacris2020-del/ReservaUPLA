using ReservaUPLA.Application.Common.Exceptions;
using ReservaUPLA.Application.DTOs.Reserva;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Services;

public class ReservaService : IReservaService
{
    private static readonly TimeOnly HorarioApertura = new(7, 0);
    private static readonly TimeOnly HorarioCierre = new(22, 0);

    private readonly IReservaRepository _reservaRepositorio;
    private readonly IAmbienteRepository _ambienteRepositorio;
    private readonly IUsuarioRepository _usuarioRepositorio;

    public ReservaService(
        IReservaRepository reservaRepository,
        IAmbienteRepository ambienteRepository,
        IUsuarioRepository usuarioRepository)
    {
        _reservaRepositorio = reservaRepository;
        _ambienteRepositorio = ambienteRepository;
        _usuarioRepositorio = usuarioRepository;
    }

    public async Task<IEnumerable<ReservaDto>> ObtenerTodasAsync(string? estado = null, Guid? ambienteId = null, Guid? usuarioId = null, DateOnly? fecha = null)
    {
        var listaEntidades = await _reservaRepositorio.GetAllAsync(estado, ambienteId, usuarioId, fecha);
        return listaEntidades.Select(entidad => ConvertirADto(entidad));
    }

    public async Task<ReservaDto> ObtenerPorIdAsync(Guid id)
    {
        var reservaEntidad = await _reservaRepositorio.GetByIdAsync(id);
        if (reservaEntidad == null)
        {
            throw new NotFoundException($"No se encontró la reserva con Id {id}.");
        }

        return ConvertirADto(reservaEntidad);
    }

    public async Task<DisponibilidadResultadoDto> VerificarDisponibilidadAsync(DisponibilidadCheckDto dto)
    {
        ValidarHorarioBasico(dto.HoraInicio, dto.HoraFin);

        var ambienteEntidad = await _ambienteRepositorio.GetByIdAsync(dto.AmbienteId);
        if (ambienteEntidad == null)
        {
            return new DisponibilidadResultadoDto
            {
                Disponible = false,
                Mensaje = "El ambiente universitario especificado no existe."
            };
        }

        if (ambienteEntidad.Estado == "No Disponible")
        {
            return new DisponibilidadResultadoDto
            {
                Disponible = false,
                Mensaje = $"El ambiente '{ambienteEntidad.Nombre}' no está disponible para reservas (Estado: {ambienteEntidad.Estado})."
            };
        }

        var reservaConflicto = await _reservaRepositorio.GetConflictoAsync(
            dto.AmbienteId,
            dto.Fecha,
            dto.HoraInicio,
            dto.HoraFin,
            dto.ExcluirReservaId);

        if (reservaConflicto != null)
        {
            return new DisponibilidadResultadoDto
            {
                Disponible = false,
                Mensaje = $"El ambiente '{ambienteEntidad.Nombre}' ya se encuentra reservado y aprobado de {reservaConflicto.HoraInicio:HH:mm} a {reservaConflicto.HoraFin:HH:mm}.",
                Conflicto = ConvertirADto(reservaConflicto)
            };
        }

        return new DisponibilidadResultadoDto
        {
            Disponible = true,
            Mensaje = $"El ambiente '{ambienteEntidad.Nombre}' se encuentra disponible para la fecha y horario solicitados."
        };
    }

    public async Task<ReservaDto> CrearReservaAsync(ReservaCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Motivo))
        {
            throw new BusinessRuleException("El motivo de la reserva es obligatorio (RN-02).");
        }

        ValidarHorarioBasico(dto.HoraInicio, dto.HoraFin);

        var solicitante = await _usuarioRepositorio.GetByIdAsync(dto.UsuarioId);
        if (solicitante == null)
        {
            throw new NotFoundException("El usuario solicitante no existe.");
        }

        if (!solicitante.Activo)
        {
            throw new BusinessRuleException("El usuario solicitante se encuentra inactivo.");
        }

        var disponibilidad = await VerificarDisponibilidadAsync(new DisponibilidadCheckDto
        {
            AmbienteId = dto.AmbienteId,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin
        });

        if (!disponibilidad.Disponible)
        {
            throw new BusinessRuleException($"No se puede registrar la reserva: {disponibilidad.Mensaje}");
        }

        var nuevaReserva = new Reserva
        {
            Id = Guid.NewGuid(),
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            Motivo = dto.Motivo.Trim(),
            Estado = "Pendiente",
            UsuarioId = dto.UsuarioId,
            AmbienteId = dto.AmbienteId,
            FechaCreacion = DateTime.UtcNow
        };

        var entidadCreada = await _reservaRepositorio.AddAsync(nuevaReserva);
        return await ObtenerPorIdAsync(entidadCreada.Id);
    }

    public async Task<ReservaDto> CambiarEstadoAsync(Guid id, ReservaCambiarEstadoDto dto)
    {
        var reserva = await _reservaRepositorio.GetByIdAsync(id);
        if (reserva == null)
        {
            throw new NotFoundException($"No se encontró la reserva con Id {id}.");
        }

        if (reserva.Estado == "Rechazada")
        {
            throw new BusinessRuleException("Una reserva rechazada no podrá modificarse (RN-06).");
        }

        if (dto.AdministradorUsuarioId.HasValue && dto.AdministradorUsuarioId.Value != Guid.Empty)
        {
            var admin = await _usuarioRepositorio.GetByIdAsync(dto.AdministradorUsuarioId.Value);
            if (admin == null || admin.Rol != "Administrador")
            {
                throw new BusinessRuleException("Solo el administrador puede aprobar o rechazar una reserva (RN-05).");
            }
        }

        var estadoNormalizado = NormalizarEstadoReserva(dto.NuevoEstado);

        if (estadoNormalizado == "Aprobada")
        {
            var disponibilidad = await VerificarDisponibilidadAsync(new DisponibilidadCheckDto
            {
                AmbienteId = reserva.AmbienteId,
                Fecha = reserva.Fecha,
                HoraInicio = reserva.HoraInicio,
                HoraFin = reserva.HoraFin,
                ExcluirReservaId = reserva.Id
            });

            if (!disponibilidad.Disponible)
            {
                throw new BusinessRuleException($"No se puede aprobar la reserva debido a un cruce: {disponibilidad.Mensaje}");
            }
        }

        reserva.Estado = estadoNormalizado;
        await _reservaRepositorio.UpdateAsync(reserva);

        return await ObtenerPorIdAsync(reserva.Id);
    }

    public async Task<bool> CancelarReservaAsync(Guid id, Guid? usuarioId = null)
    {
        var reserva = await _reservaRepositorio.GetByIdAsync(id);
        if (reserva == null)
        {
            throw new NotFoundException($"No se encontró la reserva con Id {id}.");
        }

        if (reserva.Estado == "Rechazada")
        {
            throw new BusinessRuleException("Una reserva rechazada no puede ser cancelada ni modificada (RN-06).");
        }

        if (usuarioId.HasValue && usuarioId.Value != Guid.Empty)
        {
            var solicitante = await _usuarioRepositorio.GetByIdAsync(usuarioId.Value);
            if (solicitante != null && solicitante.Rol != "Administrador" && reserva.UsuarioId != usuarioId.Value)
            {
                throw new BusinessRuleException("Solo el solicitante dueño de la reserva o un administrador pueden cancelarla.");
            }
        }

        reserva.Estado = "Cancelada";
        await _reservaRepositorio.UpdateAsync(reserva);
        return true;
    }

    private static void ValidarHorarioBasico(TimeOnly inicio, TimeOnly fin)
    {
        if (inicio >= fin)
        {
            throw new BusinessRuleException("La hora de inicio debe ser menor que la hora de fin (RN-03).");
        }

        if (inicio < HorarioApertura || fin > HorarioCierre)
        {
            throw new BusinessRuleException($"El horario de reserva debe estar comprendido dentro del rango institucional permitido de {HorarioApertura:HH:mm} a {HorarioCierre:HH:mm} horas (RN-04).");
        }
    }

    public static string NormalizarEstadoReserva(string? estado)
    {
        if (string.IsNullOrWhiteSpace(estado)) return "Pendiente";
        var norm = estado.Trim().ToLowerInvariant();
        return norm switch
        {
            "aprobada" or "aprobado" => "Aprobada",
            "rechazada" or "rechazado" => "Rechazada",
            "cancelada" or "cancelado" => "Cancelada",
            _ => "Pendiente"
        };
    }

    public static ReservaDto ConvertirADto(Reserva r)
    {
        return new ReservaDto
        {
            Id = r.Id,
            Fecha = r.Fecha,
            HoraInicio = r.HoraInicio,
            HoraFin = r.HoraFin,
            Motivo = r.Motivo,
            Estado = r.Estado,
            FechaCreacion = r.FechaCreacion,
            UsuarioId = r.UsuarioId,
            UsuarioNombre = r.Usuario != null ? r.Usuario.NombreCompleto : string.Empty,
            UsuarioCorreo = r.Usuario != null ? r.Usuario.Correo : string.Empty,
            UsuarioCodigo = r.Usuario != null ? r.Usuario.Codigo : string.Empty,
            UsuarioRol = r.Usuario != null ? r.Usuario.Rol : string.Empty,
            AmbienteId = r.AmbienteId,
            AmbienteNombre = r.Ambiente != null ? r.Ambiente.Nombre : string.Empty,
            AmbienteTipo = r.Ambiente != null ? r.Ambiente.Tipo : string.Empty,
            AmbienteUbicacion = r.Ambiente != null ? r.Ambiente.Ubicacion : string.Empty,
            AmbienteCapacidad = r.Ambiente != null ? r.Ambiente.Capacidad : 0
        };
    }

    public static ReservaDto MapearADto(Reserva r) => ConvertirADto(r);
}
