using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IReservaRepository
{
    Task<IEnumerable<Reserva>> GetAllAsync(string? estado = null, Guid? ambienteId = null, Guid? usuarioId = null, DateOnly? fecha = null);
    Task<Reserva?> GetByIdAsync(Guid id);
    Task<Reserva> AddAsync(Reserva reserva);
    Task UpdateAsync(Reserva reserva);
    Task<Reserva?> GetConflictoAsync(Guid ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, Guid? excludeReservaId = null);
    Task<int> CountAsync(string? estado = null);
    Task<int> CountByUsuarioIdAsync(Guid usuarioId);
    Task<int> CountByAmbienteIdAsync(Guid ambienteId, string? estado = null);
    Task<(string Nombre, string Tipo, int Total)> GetAmbienteMasUtilizadoAsync();
    Task<IEnumerable<(Guid AmbienteId, string Nombre, string Tipo, int TotalReservas, int Aprobadas)>> GetUsoPorAmbienteAsync(int top = 8);
    Task<IEnumerable<Reserva>> GetProximasReservasAsync(int count = 5);
}
