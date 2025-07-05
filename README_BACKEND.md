# URL Shortener - Backend API

Un acortador de URLs moderno y completo con autenticación, analytics y planes de suscripción.

## 🚀 Características

### ✅ Implementado

- **Autenticación completa** con JWT (access + refresh tokens)
- **Acortador de URLs** con códigos personalizados
- **Protección con contraseña** para URLs
- **Rate limiting** inteligente por plan de usuario
- **Validación robusta** de entrada con express-validator
- **Base de datos PostgreSQL** con Prisma ORM
- **Middleware de seguridad** con Helmet
- **Logging de intentos** de login y eventos de seguridad
- **Health check** endpoint
- **CORS** configurado para frontend

### 🔧 En desarrollo

- Analytics detallados de clicks
- Gestión de dominios personalizados
- Integración con Stripe para pagos
- Webhooks para eventos
- Sistema de roles y permisos

## 📊 Tecnologías

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: JWT con bcrypt
- **Validación**: express-validator
- **Rate limiting**: express-rate-limit
- **Seguridad**: Helmet, CORS, sanitización

## 🏗️ Estructura del proyecto

```
backend/
├── src/
│   ├── middleware/          # Middlewares personalizados
│   │   ├── auth.ts         # Autenticación JWT
│   │   ├── rateLimiter.ts  # Rate limiting por plan
│   │   └── validation.ts   # Validaciones robustas
│   ├── routes/             # Rutas de la API
│   │   ├── auth.ts         # Registro, login, refresh
│   │   ├── urls.ts         # CRUD de URLs, redirección
│   │   └── health.ts       # Health check
│   ├── utils/
│   │   └── constants.ts    # Constantes y configuración
│   └── app.ts              # Servidor principal
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── migrations/         # Migraciones
└── package.json
```

## 🗄️ Modelo de datos

### Usuarios
- Planes: FREE, PRO, ENTERPRISE
- Autenticación con email/password
- Campos: email, name, plan, isActive, lastLogin

### URLs
- Códigos cortos únicos (nanoid)
- URLs personalizadas (solo planes PRO+)
- Protección con contraseña (solo planes PRO+)
- Expiración configurable
- Tracking de clicks

### Seguridad
- Log de intentos de login
- Eventos de seguridad
- IPs bloqueadas
- Rate limiting por IP y usuario

## 🚀 Instalación y uso

### 1. Clonar e instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar base de datos

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración de PostgreSQL
# DATABASE_URL="postgresql://usuario:password@localhost:5432/url_shortener"
```

### 3. Ejecutar migraciones

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Iniciar servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📡 API Endpoints

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Perfil de usuario

### URLs

- `POST /api/urls` - Crear URL corta
- `GET /api/urls` - Listar URLs del usuario
- `GET /api/urls/:id` - Obtener detalles de URL
- `PUT /api/urls/:id` - Actualizar URL
- `DELETE /api/urls/:id` - Eliminar URL
- `GET /:shortCode` - Redirección (con analytics)

### Sistema

- `GET /api/health` - Health check

## 🔒 Seguridad

### Rate Limiting
- **Estricto**: Login, registro (5 req/15min)
- **Moderado**: API general (100 req/15min)
- **URLs**: Basado en plan de usuario
- **Redirección**: 100 redirects/min por IP

### Validación
- Validación de URLs con protocolos permitidos
- Códigos personalizados: 3-20 caracteres alfanuméricos
- Contraseñas seguras con requisitos
- Sanitización de entrada contra XSS

### Autenticación
- JWT con expiración (15min access, 30d refresh)
- Hashing de contraseñas con bcrypt (12 rounds)
- Tokens de refresh en base de datos
- Logout con invalidación de tokens

## 📊 Límites por plan

### FREE
- 100 URLs/mes
- Sin códigos personalizados
- Sin protección con contraseña
- Analytics básicos (30 días)

### PRO
- 10,000 URLs/mes
- Códigos personalizados
- Protección con contraseña
- Analytics avanzados (365 días)
- 5 dominios personalizados

### ENTERPRISE
- URLs ilimitadas
- Todas las características PRO
- Dominios ilimitados
- Analytics ilimitados
- API access

## 🧪 Testing

### Probar el servidor

```bash
# Health check
curl http://localhost:3001/api/health

# Registro de usuario
curl -X POST http://localhost:3001/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'

# Crear URL corta
curl -X POST http://localhost:3001/api/urls \\
  -H "Content-Type: application/json" \\
  -d '{"originalUrl":"https://example.com","title":"Test URL"}'
```

## 🏆 Logros completados

1. ✅ **Estructura de proyecto completa** - Backend moderno con TypeScript
2. ✅ **Base de datos diseñada** - Schema completo con relaciones
3. ✅ **Autenticación robusta** - JWT + refresh tokens + validación
4. ✅ **Middleware de seguridad** - Rate limiting, validación, sanitización
5. ✅ **CRUD de URLs** - Crear, leer, actualizar, eliminar URLs
6. ✅ **Sistema de redirección** - Con analytics básicos
7. ✅ **Límites por plan** - FREE, PRO, ENTERPRISE
8. ✅ **API funcional** - Todos los endpoints principales funcionando

## 🎯 Próximos pasos recomendados

1. **Frontend con Next.js** - Interfaz de usuario completa
2. **Analytics avanzados** - Gráficos, métricas, exportación
3. **Dominios personalizados** - Gestión y verificación DNS
4. **Integración Stripe** - Pagos y suscripciones
5. **Dashboard admin** - Gestión de usuarios y sistema
6. **API pública** - Documentación con Swagger
7. **Tests unitarios** - Cobertura completa con Jest
8. **Deploy en producción** - Docker + CI/CD

¡El backend está completamente funcional y listo para integrar con el frontend! 🎉
