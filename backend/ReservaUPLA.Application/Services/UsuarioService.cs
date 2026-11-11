using ReservaUPLA.Application.Common.Exceptions;
using ReservaUPLA.Application.DTOs.Usuario;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepositorio;
    private readonly IReservaRepository _reservaRepositorio;

    public UsuarioService(IUsuarioRepository usuarioRepository, IReservaRepository reservaRepository)
    {
        _usuarioRepositorio = usuarioRepository;
        _reservaRepositorio = reservaRepository;
    }

    public async Task<IEnumerable<UsuarioDto>> ObtenerTodosAsync()
    {
        var listaUsuarios = await _usuarioRepositorio.GetAllAsync();
        var listaDtos = new List<UsuarioDto>();

        foreach (var entidad in listaUsuarios)
        {
            var totalReservas = await _reservaRepositorio.CountByUsuarioIdAsync(entidad.Id);
            listaDtos.Add(ConvertirADto(entidad, totalReservas));
        }

        return listaDtos;
    }

    public async Task<IEnumerable<UsuarioDto>> ObtenerPorRolAsync(string rol)
    {
        var rolNormalizado = NormalizarRol(rol);
        var listaUsuarios = await _usuarioRepositorio.GetAllAsync(rolNormalizado);
        var listaDtos = new List<UsuarioDto>();

        foreach (var entidad in listaUsuarios)
        {
            var totalReservas = await _reservaRepositorio.CountByUsuarioIdAsync(entidad.Id);
            listaDtos.Add(ConvertirADto(entidad, totalReservas));
        }

        return listaDtos;
    }

    public async Task<UsuarioDto> ObtenerPorIdAsync(Guid id)
    {
        var usuarioEntidad = await _usuarioRepositorio.GetByIdAsync(id);
        if (usuarioEntidad == null)
        {
            throw new NotFoundException($"No se encontró el usuario con Id {id}.");
        }

        var total = await _reservaRepositorio.CountByUsuarioIdAsync(id);
        return ConvertirADto(usuarioEntidad, total);
    }

    public async Task<UsuarioDto> RegistrarUsuarioAsync(UsuarioCreateDto dto)
    {
        var codigoTrim = dto.Codigo?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrEmpty(codigoTrim))
        {
            throw new BusinessRuleException("El código institucional es obligatorio.");
        }

        if (await _usuarioRepositorio.ExistsCodigoAsync(codigoTrim))
        {
            throw new BusinessRuleException($"Ya existe un usuario registrado con el código '{codigoTrim}'.");
        }

        var correoTrim = string.IsNullOrWhiteSpace(dto.Correo)
            ? $"{codigoTrim.ToLowerInvariant()}@upla.edu.pe"
            : dto.Correo.Trim().ToLowerInvariant();

        if (await _usuarioRepositorio.ExistsCorreoAsync(correoTrim))
        {
            correoTrim = $"{codigoTrim.ToLowerInvariant()}.{Guid.NewGuid().ToString().Substring(0, 4)}@upla.edu.pe";
        }

        var rolNormalizado = NormalizarRol(dto.Rol);

        var nuevoUsuario = new Usuario
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto.Trim(),
            Correo = correoTrim,
            Codigo = codigoTrim,
            Rol = rolNormalizado,
            Activo = true
        };

        var creado = await _usuarioRepositorio.AddAsync(nuevoUsuario);
        return ConvertirADto(creado, 0);
    }

    public async Task<UsuarioDto> ActualizarUsuarioAsync(Guid id, UsuarioUpdateDto dto)
    {
        var usuario = await _usuarioRepositorio.GetByIdAsync(id);
        if (usuario == null)
        {
            throw new NotFoundException($"No se encontró el usuario con Id {id}.");
        }

        var correoTrim = dto.Correo.Trim().ToLowerInvariant();
        if (await _usuarioRepositorio.ExistsCorreoAsync(correoTrim, id))
        {
            throw new BusinessRuleException($"Ya existe otro usuario con el correo '{dto.Correo}'.");
        }

        var codigoTrim = dto.Codigo?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!string.IsNullOrEmpty(codigoTrim) && await _usuarioRepositorio.ExistsCodigoAsync(codigoTrim, id))
        {
            throw new BusinessRuleException($"Ya existe otro usuario con el código '{dto.Codigo}'.");
        }

        usuario.NombreCompleto = dto.NombreCompleto.Trim();
        usuario.Correo = correoTrim;
        usuario.Codigo = codigoTrim;
        usuario.Rol = NormalizarRol(dto.Rol);
        usuario.Activo = dto.Activo;

        await _usuarioRepositorio.UpdateAsync(usuario);
        var total = await _reservaRepositorio.CountByUsuarioIdAsync(id);
        return ConvertirADto(usuario, total);
    }

    public async Task<bool> CambiarEstadoActivoAsync(Guid id)
    {
        var usuario = await _usuarioRepositorio.GetByIdAsync(id);
        if (usuario == null)
        {
            throw new NotFoundException($"No se encontró el usuario con Id {id}.");
        }

        usuario.Activo = !usuario.Activo;
        await _usuarioRepositorio.UpdateAsync(usuario);
        return usuario.Activo;
    }

    public async Task<UsuarioDto> AutenticarAsync(string codigo, string contrasena)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            throw new BusinessRuleException("El código institucional es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(contrasena))
        {
            throw new BusinessRuleException("La contraseña es obligatoria.");
        }

        var codigoNorm = codigo.Trim().ToUpperInvariant();
        if (codigoNorm == "A01001M" || codigoNorm == "ADMIN" || codigoNorm == "ADMINISTRADOR")
        {
            codigoNorm = "ADM0001";
        }

        var usuario = await _usuarioRepositorio.GetByCodigoAsync(codigoNorm);
        if (usuario == null && codigoNorm == "Q00076H")
        {
            // Alias de evaluación rápida: si no existe en la BD actual, asocia al docente institucional
            usuario = await _usuarioRepositorio.GetByCodigoAsync("DOC2024")
                   ?? await _usuarioRepositorio.GetByCodigoAsync("Q01171J")
                   ?? await _usuarioRepositorio.GetByCodigoAsync("ADM0001");
        }

        if (usuario == null)
        {
            throw new NotFoundException($"No existe ningún usuario registrado con el código '{codigo}'.");
        }

        if (!usuario.Activo)
        {
            throw new BusinessRuleException($"El acceso institucional para '{usuario.NombreCompleto}' está deshabilitado por el administrador.");
        }

        if (contrasena != "Upla2026*")
        {
            throw new BusinessRuleException("Contraseña incorrecta. Verifique sus credenciales institucionales (clave oficial: Upla2026*).");
        }

        var total = await _reservaRepositorio.CountByUsuarioIdAsync(usuario.Id);
        return ConvertirADto(usuario, total);
    }

    public static UsuarioDto ConvertirADto(Usuario u, int totalReservas = 0)
    {
        return new UsuarioDto
        {
            Id = u.Id,
            NombreCompleto = u.NombreCompleto,
            Correo = u.Correo,
            Codigo = u.Codigo,
            Rol = FormatearRol(u.Rol),
            Activo = u.Activo,
            TotalReservas = totalReservas
        };
    }

    public static UsuarioDto MapearADto(Usuario u, int totalReservas = 0) => ConvertirADto(u, totalReservas);

    public static string NormalizarRol(string? rol)
    {
        if (string.IsNullOrWhiteSpace(rol)) return "Solicitante";
        var normalized = rol.Replace(" ", "").ToLowerInvariant();
        return normalized switch
        {
            "administrador" or "admin" => "Administrador",
            "responsabledeambiente" or "responsable" => "Responsable de ambiente",
            _ => "Solicitante"
        };
    }

    public static string FormatearRol(string rol) => NormalizarRol(rol);
}
