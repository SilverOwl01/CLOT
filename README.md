# CLOT — Sistema de Monitoreo de Anticoagulación

Sistema digital para el seguimiento clínico de pacientes en terapia anticoagulante oral (TAO).

## Estructura del repositorio

```
CLOT/
├── dashboard/     # Panel web para médicos (React + Vite + Firebase)
└── mobile/        # App móvil para pacientes (React + Capacitor + Android)
```

## Proyectos

### Dashboard (`/dashboard`)
Panel de control para el equipo clínico. Permite visualizar pacientes, registrar valores de INR, generar alertas y ajustar dosis de warfarina.

**Stack:** React, Vite, Tailwind CSS, Firebase (Auth + Firestore)

### App Móvil (`/mobile`)
Aplicación para pacientes que permite registrar sus valores de INR, consultar su dosis y comunicarse con el equipo médico.

**Stack:** React, Vite, Capacitor, Android

---

## Configuración

Cada proyecto requiere un archivo `.env` con las credenciales de Firebase. Consulta el archivo `.env.example` dentro de cada carpeta para saber qué variables configurar.

```bash
# En dashboard/
cp .env.example .env

# En mobile/
cp .env.example .env
```

## Licencia

Este proyecto es parte de una investigación clínica. Ver `LICENSE` para más detalles.
