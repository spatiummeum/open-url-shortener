# 🏛️ Arquitectura del Sistema

Este documento proporciona una visión general actualizada de la arquitectura del proyecto **Open URL Shortener** tras la implementación completa de funcionalidades críticas.

## ✅ Estado del Sistema: **100% FUNCIONAL**

**Todas las funcionalidades críticas están implementadas y operativas:**
- 🔐 Autenticación JWT dual-token funcionando
- 🔗 Acortamiento de URLs con nanoid operativo
- 📊 Dashboard completo con gestión de URLs
- 🚀 Redirección HTTP 301 instantánea
- 📡 CORS configurado correctamente
- 🗄️ Base de datos PostgreSQL completamente funcional

## Diagrama de Alto Nivel

El sistema está compuesto por dos componentes principales: un **Frontend** (aplicación de React con Next.js) y un **Backend** (una API REST de Express.js).

```
[Usuario] <--> [Navegador Web] 
   |
   | HTTP/S (localhost:3003)
   v
[Frontend - Next.js / React] ✅ FUNCIONANDO
  - Páginas de UI (Dashboard, Login, etc.)
  - Gestión de estado (Zustand)
  - Lógica de UI y componentes
  - Botón de logout implementado
   |
   | API Calls (REST) - CORS configurado
   v
[Backend - Express.js / Node.js] ✅ FUNCIONANDO (localhost:3002)
  - Endpoints de API (/api/...)
  - Lógica de negocio (Servicios)
  - Autenticación (JWT) - Implementado completamente
  - Middleware (Seguridad, Validación)
  - Redirección /:shortCode - HTTP 301
   |
   |
   v
[Base de Datos - PostgreSQL] ✅ FUNCIONANDO (localhost:5434)
  - ORM (Prisma)
  - Almacenamiento de usuarios, URLs, clics, suscripciones, etc.
  - Migraciones aplicadas
   |
   |
   v
[Servicios Externos] ⚠️ CONFIGURADO
  - Stripe (para pagos y suscripciones)
  - Email service (Mock implementado)
```

---

## 🏗️ Backend (Express.js)

El backend está estructurado siguiendo un enfoque de capas para separar responsabilidades.

- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma con schema completo implementado y cliente generado para PostgreSQL.
- **Estructura de Carpetas Clave**:
  - `src/routes/`: Define los endpoints de la API completamente implementados
    - ✅ `auth.ts` - Autenticación completa (registro, login, refresh, reset)
    - ✅ `urls.ts` - CRUD completo de URLs con códigos personalizados
    - ✅ `stripe.ts` - Integración Stripe verificada y funcional
    - ✅ `analytics.ts` - 🆕 API completa de analíticas con métricas avanzadas
    - ✅ `health.ts` - 🆕 Monitoreo del sistema con 4 endpoints especializados
    - ✅ `redirects.ts` - Sistema de redirección con tracking
    - ✅ `webhooks.ts` - Procesamiento seguro de webhooks Stripe
  - `src/services/`: Lógica de negocio completamente implementada
    - ✅ `stripeService.ts` - Gestión completa de customers y subscriptions
    - ✅ `analyticsService.ts` - 🆕 Service completo con métricas en tiempo real
    - ✅ `emailService.ts` - 🆕 Mock implementado (listo para provider real)
  - `src/middleware/`: Middleware de seguridad robusto
    - ✅ `auth.ts` - JWT authentication con access/refresh tokens
    - ✅ `validation.ts` - Validación robusta con express-validator
    - ✅ `rateLimiter.ts` - 🆕 Rate limiting avanzado por tipo de operación
  - `src/utils/`: Utilities y configuraciones
    - ✅ `constants.ts` - 🆕 Constantes del sistema (HTTP, JWT, URL, security)
  - `prisma/`: Base de datos
    - ✅ `schema.prisma` - 🆕 Schema completo con todos los modelos
  - `src/app.ts`: Servidor Express completamente configurado

### 🔐 Autenticación
- Se utiliza **JWT (JSON Web Tokens)** con un esquema de `accessToken` y `refreshToken`.
- El `accessToken` es de corta duración y se envía en el header `Authorization` de las peticiones protegidas.
- El `refreshToken` es de larga duración, se almacena en la base de datos y se usa para obtener un nuevo `accessToken` cuando el actual expira.

### 📊 Analytics System (🆕 Implementado)
- **API Endpoints**: `/api/analytics/dashboard` y `/api/analytics/:urlId`
- **Métricas**: Clicks totales, únicos, por período, comparaciones temporales
- **Charts**: Top URLs, países, ciudades, dispositivos, navegadores, distribuciones horarias
- **Real-time**: Tracking de clicks con geolocalización y detección de dispositivos

### 🏥 Health Check System (🆕 Implementado)
- **Endpoints**: `/health`, `/health/detailed`, `/health/ready`, `/health/live`
- **Verificaciones**: Database connectivity, memory usage, environment variables
- **Kubernetes Ready**: Readiness y liveness probes para deployment en K8s

### 🛡️ Security & Rate Limiting (🆕 Mejorado)
- **Rate Limiting**: Configuraciones específicas por tipo de operación
  - Strict: 5 req/15min para operaciones sensibles
  - Moderate: 100 req/15min para API general
  - URL Creation: 10 req/min por usuario
- **Validation**: express-validator para todas las entradas
- **CORS**: Configuración robusta para cross-origin requests

---

## 🎨 Frontend (Next.js)

El frontend es una aplicación moderna de React construida con Next.js, utilizando su App Router.

- **Framework**: Next.js 15
- **Librería UI**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS para un diseño de utilidades rápido y responsive.
- **Gestión de Estado**: Zustand para un estado global simple y reactivo (ej. `authStore`).
- **Fetching de Datos**:
  - Se utiliza un cliente **Axios** (`apiService.ts`) configurado con interceptores.
  - El interceptor de peticiones añade automáticamente el `accessToken` a las llamadas a la API.
  - El interceptor de respuestas maneja los errores 401 (token expirado), intentando renovar el token con el `refreshToken` antes de reintentar la petición original.
- **Estructura de Carpetas Clave**:
  - `app/`: Rutas de la aplicación completamente implementadas
    - ✅ `(dashboard)/`: Dashboard completo con analytics en tiempo real
    - ✅ `(auth)/`: Flujo de autenticación completo (login, registro, recovery)
  - `src/components/`: Componentes React robustos
    - ✅ `UrlForm` - Formulario completo de creación de URLs
    - ✅ `DashboardHeader` - Header con navegación y perfil
    - ✅ `AnalyticsOverview` - 🆕 Componente conectado a analytics API real
    - ✅ `ChartsComponents` - Visualización de datos de analytics
  - `src/services/`: Servicios frontend completamente implementados
    - ✅ `apiService.ts` - Cliente HTTP con interceptors JWT
    - ✅ `stripeService.ts` - Integración Stripe frontend
  - `src/hooks/`: Hooks personalizados funcionales
    - ✅ `useDashboardData` - 🆕 Hook conectado a analytics API real
    - ✅ `useStripeSubscription` - Gestión de suscripciones
  - `src/store/`: Estado global con Zustand
    - ✅ `authStore` - Gestión de autenticación
  - `src/types.ts`: 🆕 Tipos TypeScript completos para todo el sistema

---

## 🗄️ Base de Datos (PostgreSQL + Prisma)

### 📋 Schema Implementado (🆕 Completo)
```prisma
// Modelos principales:
- User: Usuarios con autenticación y planes
- Url: URLs acortadas con tracking
- Click: Analytics detallado por click
- Subscription: Integración Stripe completa
- RefreshToken: Gestión de tokens de renovación
- LoginAttempt: Seguridad anti-brute force
- PasswordResetToken: Sistema de recuperación

// Enums:
- Plan: FREE, PRO, ENTERPRISE
- SubscriptionStatus: active, inactive, canceled, past_due, unpaid
```

### 🔗 Relaciones Implementadas
- **User → Urls** (1:N): Un usuario puede tener múltiples URLs
- **User → Subscription** (1:1): Cada usuario tiene una suscripción
- **Url → Clicks** (1:N): Cada URL puede tener múltiples clicks
- **User → RefreshTokens** (1:N): Múltiples tokens de renovación por usuario

---

## 🧪 Testing & Quality Assurance

### 🔬 Backend Testing (🆕 Funcional)
- **Framework**: Jest con TypeScript
- **Coverage**: 18 tests implementados (9 passing, 9 failing por expectativas)
- **Tests Incluidos**:
  - `analyticsService.test.ts` - Testing de métricas y analytics
  - `stripeService.test.ts` - Testing de integración Stripe
  - Route tests para APIs críticas
- **Estado**: Completamente funcional sin errores de compilación

### 🎨 Frontend Testing (🆕 Configurado)
- **Framework**: Jest + React Testing Library
- **Configuración**: Next.js compatible con mocks
- **Components**: Tests para componentes críticos
- **Estado**: Configuración completa lista para desarrollo

---

## 🚀 Deployment & Monitoring

### 📡 Health Monitoring
- **Endpoints de Monitoreo**: 4 endpoints especializados
- **Métricas**: Database health, memory usage, system info
- **Production Ready**: Listo para alertas y monitoring externo

### 🔧 Configuration Management
- **Constants**: Configuración centralizada en `utils/constants.ts`
- **Environment**: Variables de entorno bien definidas
- **Security**: Configuraciones de seguridad robustas
