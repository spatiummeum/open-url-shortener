# Configuración de Base de Datos

## Opción 1: PostgreSQL Local

### Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Descargar desde https://www.postgresql.org/download/windows/
```

### Configurar Base de Datos
```bash
# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER url_shortener_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE url_shortener OWNER url_shortener_user;
GRANT ALL PRIVILEGES ON DATABASE url_shortener TO url_shortener_user;
\q
```

### Actualizar .env
```env
DATABASE_URL="postgresql://url_shortener_user:secure_password_123@localhost:5432/url_shortener"
```

## Opción 2: Docker PostgreSQL

```bash
# Crear contenedor PostgreSQL
docker run --name url-shortener-db \
  -e POSTGRES_USER=url_shortener_user \
  -e POSTGRES_PASSWORD=secure_password_123 \
  -e POSTGRES_DB=url_shortener \
  -p 5432:5432 \
  -d postgres:15
```

## Opción 3: Base de Datos en la Nube

### Supabase (Gratis)
1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Copiar la DATABASE_URL desde Settings > Database

### Neon (Gratis)
1. Ir a https://neon.tech
2. Crear nuevo proyecto
3. Copiar la connection string

## Ejecutar Migraciones

Una vez configurada la base de datos:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

## Verificar Conexión

```bash
cd backend
npx prisma studio
```

Esto abrirá una interfaz web para ver y editar los datos de la base de datos.