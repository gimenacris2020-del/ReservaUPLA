using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IAmbienteRepository
{
    Task<IEnumerable<Ambiente>> GetAllAsync(string? tipo = null, string? estado = null);
    Task<Ambiente?> GetByIdAsync(Guid id);
    Task<Ambiente> AddAsync(Ambiente ambiente);
    Task UpdateAsync(Ambiente ambiente);
    Task<bool> ExistsNombreAsync(string nombre, Guid? excludeId = null);
    Task<int> CountAsync(string? estado = null);
}
