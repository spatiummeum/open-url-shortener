# Open URL Shortener

Un acortador de URLs de código abierto, completo y moderno, construido con un backend de Express.js y un frontend de Next.js. Incluye funcionalidades avanzadas como analíticas, gestión de suscripciones con Stripe y protección de enlaces.

## ✨ Características Principales

- **Autenticación Segura**: Registro, login y gestión de sesión con JWT (Access y Refresh Tokens).
- **Acortamiento de URLs**: Generación de enlaces cortos con códigos personalizados y aleatorios.
- **Protección de Enlaces**: URLs protegidas por contraseña y con fecha de expiración.
- **Dashboard de Analíticas**: Métricas detalladas sobre clics, visitantes, países, navegadores y más.
- **Integración con Stripe**: Gestión de suscripciones (Free, Pro, Enterprise) y procesamiento de pagos.
- **Gestión de URLs**: Interfaz para crear, ver, editar y eliminar enlaces.
- **Middleware de Seguridad**: Rate limiting, validación de entradas y sanitización.

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL (o la configurada en Prisma)
- **Autenticación**: JWT (JSON Web Tokens)
- **Pagos**: Stripe

### Frontend
- **Framework**: Next.js 15
- **Librería UI**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Gestión de Estado**: Zustand
- **Fetching de Datos**: Axios con interceptores para el manejo de tokens.
- **Gráficos**: Recharts

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js (v18+)
- npm, yarn, o pnpm
- Git

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd open-url-shortener
```

### 2. Configurar Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` en la raíz de `/backend` y configura las siguientes variables:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="tu_super_secreto_jwt"
JWT_REFRESH_SECRET="tu_otro_super_secreto_jwt"
FRONTEND_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```
Ejecuta las migraciones de Prisma:
```bash
npx prisma migrate dev
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```
Crea un archivo `.env.local` en la raíz de `/frontend` y configura las variables:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🏃‍♂️ Ejecutar la Aplicación

- **Para iniciar el servidor del backend:**
  ```bash
  cd backend
  npm run dev
  ```
- **Para iniciar la aplicación del frontend:**
  ```bash
  cd frontend
  npm run dev
  ```

La aplicación estará disponible en `http://localhost:3000`.

## 🧪 Ejecutar Pruebas

**IMPORTANTE**: Actualmente, la configuración de Jest está rota tanto en el frontend como en el backend. Es una de las tareas prioritarias a corregir.

Una vez solucionado, los tests se podrán ejecutar con:

- **Backend:**
  ```bash
  cd backend
  npm test
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm test
  ```
