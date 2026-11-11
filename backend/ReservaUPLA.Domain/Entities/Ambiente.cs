namespace ReservaUPLA.Domain.Entities;

public class Ambiente
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = "Laboratorio de Cómputo";
    public int Capacidad { get; set; }
    public string Ubicacion { get; set; } = string.Empty;
    public string Estado { get; set; } = "Disponible";
}
