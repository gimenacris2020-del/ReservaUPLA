# ReservaUPLA — Sistema de Gestión y Control de Espacios Universitarios

Plataforma web integral para la reserva, supervisión y auditoría en tiempo real de laboratorios de cómputo, auditorios y salas académicas de la **Universidad Peruana Los Andes (UPLA)**.

## 📌 Arquitectura y Tecnologías

- **Backend**: .NET 10 en C# bajo principios de **Arquitectura Limpia (Clean Architecture)**:
  - `ReservaUPLA.Domain`: Entidades del núcleo (`Usuario`, `Ambiente`, `Reserva`) con desacoplamiento tipado mediante cadenas (`string`).
  - `ReservaUPLA.Application`: Servicios de aplicación, DTOs, validaciones y contratos de repositorio.
  - `ReservaUPLA.Infrastructure`: Persistencia con Entity Framework Core, PostgreSQL y `DbSeeder`.
  - `ReservaUPLA.API`: Endpoints RESTful con validaciones estrictas y respuestas JSON unificadas.
- **Frontend**: React 19 + Vite + Tailwind CSS v4:
  - Navegación ejecutiva con **Sidebar Oficial UPLA** (`#003366`) y **Navbar Editorial de Breadcrumbs**.
  - Componentes accesibles con `@base-ui/react` e iconografía semántica de `lucide-react`.
  - Dashboard analítico con cuadrícula asimétrica (*Bento Grid*), timeline en formato ticket para solicitudes y pipeline de aprobación de estados.
- **Base de Datos**: PostgreSQL con migraciones y datos institucionales precargados.

## 🚀 Puesta en Marcha

### Prerrequisitos
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/) y [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/)

### 1. Base de Datos y Backend
```bash
cd backend/ReservaUPLA.API
dotnet run
```
*La API estará disponible en `http://localhost:5000` con documentación Swagger en `/swagger`.*

### 2. Frontend
```bash
cd frontend
pnpm install
pnpm run dev
```
*La interfaz estará disponible en `http://localhost:5173`.*

---

## 👥 Roles Institucionales y Acceso
- **Administrador**: Evaluación y aprobación de solicitudes, gestión de ambientes, auditoría de usuarios y reportes métricos.
- **Solicitante (Docente)**: Verificación de disponibilidad horaria en tiempo real, registro de solicitudes y seguimiento de estado.
- **Responsable de ambiente**: Supervisión de disponibilidad física y mantenimiento de espacios universitarios asignados.

---
**Universidad Peruana Los Andes — Huancayo • Chanchamayo**
