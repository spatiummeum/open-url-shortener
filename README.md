# Open URL Shortener 🔗

> Sistema completo de acortamiento de URLs con autenticación, dashboard y analytics.

## 🚀 Estado del Proyecto

**✅ COMPLETAMENTE FUNCIONAL** - Lista para producción

- ✅ **Autenticación JWT** - Registro, login, logout
- ✅ **Acortamiento de URLs** - Generación automática con nanoid
- ✅ **Dashboard completo** - Gestión de URLs
- ✅ **Redirección HTTP 301** - Funcionamiento instantáneo
- ✅ **Base de datos PostgreSQL** - Completamente configurada
- ✅ **API RESTful** - Endpoints completamente funcionales

## 🛠️ Stack Tecnológico

### Backend
- **Express.js** + TypeScript
- **Prisma ORM** + PostgreSQL
- **JWT** para autenticación
- **Rate limiting** y seguridad
- **nanoid** para códigos únicos

### Frontend
- **Next.js 15** + React 19
- **TypeScript** + Tailwind CSS
- **Zustand** para estado global
- **Axios** con interceptores

## 🏃‍♂️ Inicio Rápido

### 1. Configuración Inicial

```bash
# Clonar el proyecto
git clone <repository-url>
cd open-url-shortener

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
```

### 2. Variables de Entorno

**Backend (`.env`)**:
```env
DATABASE_URL="postgresql://url_shortener_user:secure_password_123@localhost:5434/url_shortener"
JWT_SECRET="your-super-secure-jwt-secret-key"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key"
NODE_ENV="development"
PORT=3002
FRONTEND_URL="http://localhost:3003"
BASE_URL="http://localhost:3002"
```

**Frontend (`.env.local`)**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3002/api"
NEXT_PUBLIC_APP_URL="http://localhost:3003"
```

### 3. Base de Datos

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Iniciar Servicios

```bash
# Backend (Terminal 1)
cd backend
npm run dev
# 🚀 Backend: http://localhost:3002

# Frontend (Terminal 2)
cd frontend
npm run dev
# 🚀 Frontend: http://localhost:3003
```

## 📱 Uso de la Aplicación

### Acceso a la Aplicación
- **Web**: http://localhost:3003
- **API**: http://localhost:3002/api
- **Health**: http://localhost:3002/api/health

### Flujo de Usuario

1. **Registro**: http://localhost:3003/register
2. **Login**: http://localhost:3003/login
3. **Dashboard**: http://localhost:3003/dashboard
4. **Crear URL**: Botón "New URL" o http://localhost:3003/urls/new
5. **Gestionar URLs**: http://localhost:3003/urls

### Ejemplo de Uso

```
📥 INPUT:  https://example.com/very-long-url-with-parameters
🔄 PROCESS: Generar código único (ej: BnTyg2bp)
📤 OUTPUT: http://localhost:3002/BnTyg2bp
🔀 REDIRECT: HTTP 301 → URL original
```

## 🌐 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/me` - Perfil del usuario
- `POST /api/auth/refresh` - Renovar token

### URLs
- `POST /api/urls` - Crear URL acortada
- `GET /api/urls` - Listar URLs del usuario
- `GET /api/urls/:id` - Obtener URL específica
- `PUT /api/urls/:id` - Actualizar URL
- `DELETE /api/urls/:id` - Eliminar URL

### Sistema
- `GET /api/health` - Estado del sistema
- `GET /:shortCode` - Redirección de URL

## 💡 Características Técnicas

### Seguridad
- 🔐 **JWT dual-token** (access + refresh)
- 🛡️ **Rate limiting** en todos los endpoints
- 🔒 **CORS configurado** correctamente
- 📝 **Validación de entrada** con express-validator
- 🔑 **Password hashing** con bcryptjs

### Performance
- ⚡ **Redirección HTTP 301** instantánea
- 🎯 **Códigos únicos** de 8 caracteres
- 📊 **Base de datos optimizada** PostgreSQL
- 🔄 **Auto-refresh** de tokens JWT

### UI/UX
- 📱 **Responsive design** para móviles
- 🎨 **Tailwind CSS** con efectos modernos
- 🖱️ **Dashboard intuitivo** con gestión completa
- 🚪 **Botón de logout** funcional
- 📋 **Validación de formularios** mejorada

## 🔧 Comandos de Desarrollo

```bash
# Backend
npm run dev          # Servidor de desarrollo
npm test            # Ejecutar tests
npx prisma studio   # Interfaz de base de datos
npx prisma migrate dev # Aplicar migraciones

# Frontend
npm run dev         # Servidor de desarrollo
npm run build       # Build de producción
npm run lint        # Verificar código
npm run type-check  # Verificar tipos TypeScript
```

## 🗂️ Estructura del Proyecto

```
open-url-shortener/
├── backend/
│   ├── src/
│   │   ├── routes/          # Rutas API
│   │   ├── middleware/      # Middleware de autenticación
│   │   ├── services/        # Lógica de negocio
│   │   ├── utils/           # Utilidades
│   │   └── prisma/          # Esquema de base de datos
│   └── .env                 # Variables de entorno
├── frontend/
│   ├── app/                 # Páginas Next.js
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── services/        # Cliente API
│   │   ├── store/           # Estado global
│   │   └── types.ts         # Tipos TypeScript
│   └── .env.local           # Variables de entorno
└── README.md
```

## 📊 Base de Datos

### Modelos Principales
- **User**: Usuarios del sistema
- **URL**: URLs acortadas
- **Click**: Tracking de clicks
- **RefreshToken**: Tokens de renovación

### Relaciones
- User → URLs (1:many)
- URL → Clicks (1:many)
- User → RefreshTokens (1:many)

## 🌟 Funcionalidades Completadas

### ✅ Autenticación
- [x] Registro de usuarios
- [x] Login con JWT
- [x] Logout funcional
- [x] Refresh de tokens automático
- [x] Middleware de autenticación

### ✅ URLs
- [x] Generación de códigos únicos
- [x] Acortamiento de URLs
- [x] Redirección HTTP 301
- [x] Dashboard de gestión
- [x] Listado de URLs

### ✅ UI/UX
- [x] Dashboard responsivo
- [x] Formularios validados
- [x] Botones funcionales
- [x] Navegación completa
- [x] Botón de logout

### ✅ Infraestructura
- [x] Base de datos PostgreSQL
- [x] CORS configurado
- [x] Variables de entorno
- [x] Middleware de seguridad

## 🔮 Mejoras Futuras

- [ ] API de gestión de usuarios
- [ ] Dominios personalizados
- [ ] Servicio de email real
- [ ] Analíticas avanzadas
- [ ] Notificaciones toast
- [ ] Documentación Swagger

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Verificar variables de entorno
cat backend/.env

# Verificar puerto
netstat -tulpn | grep :3002
```

### Frontend no conecta
```bash
# Verificar configuración CORS
curl -I http://localhost:3002/api/health

# Verificar variables de entorno
cat frontend/.env.local
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Estado**: ✅ **COMPLETAMENTE FUNCIONAL**  
**Versión**: 1.0.0  
**Última Actualización**: Julio 2025

¡El sistema está 100% operativo y listo para usar! 🚀