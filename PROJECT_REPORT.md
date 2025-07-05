# Informe Técnico: Open URL Shortener

## 1. Resumen del Proyecto
Sistema completo para acortamiento de URLs con:
- **Backend**: API REST con Express.js y Prisma ORM
- **Frontend**: Aplicación Next.js con React 19
- **Base de datos**: PostgreSQL con modelo de datos robusto
- **Características principales**: 
  - Acortamiento de URLs con seguimiento analítico
  - Gestión de usuarios y planes de suscripción
  - Dominios personalizados
  - Integración con Stripe para pagos
  - Mecanismos avanzados de seguridad

## 2. Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución |
| Express | 5.1.0 | Framework web |
| Prisma | 6.10.1 | ORM para PostgreSQL |
| Redis | 5.5.6 | Caché y rate limiting |
| Stripe | 18.2.1 | Procesamiento de pagos |
| Winston | 3.17.0 | Logging estructurado |
| Jest | 30.0.3 | Testing |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.3.4 | Framework React |
| React | 19.1.0 | Biblioteca UI |
| Zustand | 5.0.6 | Gestión de estado |
| Tailwind CSS | 4.1.11 | Estilización |
| Framer Motion | 12.19.2 | Animaciones |
| React Hook Form | 7.48.2 | Manejo de formularios |

### Base de Datos
- **Sistema**: PostgreSQL
- **Modelado**: Definido en Prisma Schema
- **Características**:
  - Modelos relacionales para usuarios, URLs y analíticas
  - Índices optimizados para consultas frecuentes
  - Enums para estados y tipos (planes, eventos de seguridad)

### Herramientas y DevOps
- Docker (composición de servicios)
- Jest (pruebas unitarias)
- ESLint + Prettier (calidad de código)
- GitHub Actions (CI/CD)
- Renovate (actualización de dependencias)

## 3. Estructura Modular

### Backend
```
backend/
├── prisma/
│   └── schema.prisma        # Modelo de datos
├── src/
│   ├── controllers/         # Lógica de endpoints
│   ├── middleware/          # Seguridad y validación
│   ├── routes/              # Definición de rutas
│   ├── services/            # Lógica de negocio
│   ├── utils/               # Utilidades compartidas
│   └── app.ts               # Punto de entrada
├── scripts/                 # Scripts de mantenimiento
└── tests/                   # Pruebas unitarias
```

### Frontend
```
frontend/
├── app/                     # Rutas de Next.js
├── src/
│   ├── components/          # Componentes UI
│   ├── hooks/               # Custom hooks
│   ├── services/            # Conexión con API
│   ├── store/               # Gestión de estado (Zustand)
│   └── lib/                 # Utilidades
└── __tests__/               # Pruebas de componentes
```

## 4. Características Principales

### Gestión de URLs
- Acortamiento con códigos únicos (8 caracteres)
- Protección con contraseña
- Dominios personalizados
- Analytics detallados:
  - Geolocalización
  - Dispositivos y navegadores
  - Sesiones de usuario

### Seguridad Avanzada
- Autenticación JWT con refresh tokens
- Rate limiting inteligente
- Detección de actividad sospechosa
- Registro de eventos de seguridad
- Bloqueo de IPs maliciosas

### Modelo de Negocio
- Planes FREE, PRO y ENTERPRISE
- Integración con Stripe:
  - Gestión de suscripciones
  - Períodos de facturación
  - Webhooks para eventos de pago

### Dashboard
- Estadísticas de uso en tiempo real
- Gestión de URLs
- Configuración de dominios
- Facturación y planes

### Operaciones
- Health checks con monitoreo de:
  - Base de datos
  - Caché
  - Uso de memoria
- Métricas de rendimiento
- Shutdown graceful


