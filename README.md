# Open URL Shortener

Un sistema completo de acortamiento de URLs con análisis avanzado, dominios personalizados y características empresariales.

## 🚀 Características

- **Acortamiento de URLs**: Genera enlaces cortos personalizables
- **Análisis Avanzado**: Seguimiento de clics, geolocalización, dispositivos
- **Dominios Personalizados**: Usa tu propio dominio para enlaces cortos
- **Protección con Contraseña**: Protege enlaces sensibles
- **Planes de Suscripción**: FREE, PRO y ENTERPRISE
- **API REST**: Integración completa para desarrolladores
- **Seguridad Avanzada**: Rate limiting, detección de actividad sospechosa
- **Dashboard Interactivo**: Gestión completa desde la interfaz web

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js** - API REST
- **Prisma** + **PostgreSQL** - Base de datos y ORM
- **Redis** - Caché y rate limiting
- **Winston** - Logging estructurado
- **Stripe** - Procesamiento de pagos
- **JWT** - Autenticación y autorización

### Frontend
- **Next.js 15** - Framework React con SSR
- **React 18** - Biblioteca de interfaz
- **Tailwind CSS** - Estilización
- **Zustand** - Gestión de estado
- **Framer Motion** - Animaciones
- **React Hook Form** - Manejo de formularios
- **Recharts** - Gráficos y visualizaciones

## 📁 Estructura del Proyecto

```
open-url-shortener/
├── backend/                 # API Backend
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middlewares
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades
│   │   └── app.ts          # Punto de entrada
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de la base de datos
│   │   └── seed.ts         # Datos de prueba
│   └── package.json
├── frontend/               # Frontend Next.js
│   ├── app/               # App Router de Next.js
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Servicios de API
│   │   ├── store/         # Gestión de estado
│   │   └── utils/         # Utilidades
│   └── package.json
└── README.md
```

## 🚦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para caché)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/spatiummeum/open-url-shortener.git
cd open-url-shortener
```

### 2. Configurar Backend
```bash
cd backend
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install

# Copiar y configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Producción
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📊 Variables de Entorno

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://usuario:password@localhost:5432/url_shortener"
JWT_SECRET="tu-secreto-jwt"
JWT_REFRESH_SECRET="tu-secreto-refresh"
REDIS_URL="redis://localhost:6379"
STRIPE_SECRET_KEY="sk_test_..."
FRONTEND_URL="http://localhost:3000"
BASE_URL="http://localhost:3001"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh` - Renovar token

### URLs
- `POST /api/urls` - Crear URL corta
- `GET /api/urls` - Listar URLs del usuario
- `GET /api/urls/:id` - Obtener URL específica
- `PUT /api/urls/:id` - Actualizar URL
- `DELETE /api/urls/:id` - Eliminar URL

### Análisis
- `GET /api/analytics/:urlId` - Análisis de una URL
- `GET /api/analytics/dashboard` - Dashboard de análisis

### Usuarios
- `GET /api/users/profile` - Perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil

### Dominios
- `GET /api/domains` - Listar dominios
- `POST /api/domains` - Agregar dominio
- `DELETE /api/domains/:id` - Eliminar dominio

## 🔒 Seguridad

- **Rate Limiting**: Límites por IP y usuario
- **Validación de Entrada**: Validación estricta de datos
- **Autenticación JWT**: Tokens seguros con rotación
- **Logging de Seguridad**: Registro de eventos sospechosos
- **Sanitización**: Limpieza de datos de entrada
- **CORS**: Configuración de orígenes permitidos

## 📈 Características Premium

### Plan PRO
- Hasta 50,000 URLs por mes
- Análisis avanzados
- Dominios personalizados
- Soporte prioritario

### Plan ENTERPRISE
- URLs ilimitadas
- API completa
- Soporte 24/7
- SLA garantizado
- Integraciones personalizadas

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: contact@urlshortener.com
- **Website**: https://urlshortener.com
- **GitHub**: https://github.com/spatiummeum/open-url-shortener

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el excelente framework
- [Prisma](https://prisma.io/) por el ORM moderno
- [Tailwind CSS](https://tailwindcss.com/) por el sistema de diseño
- [Vercel](https://vercel.com/) por el hosting
- Todos los contribuidores del proyecto
