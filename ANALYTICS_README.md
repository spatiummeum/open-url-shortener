# Analytics Features - URL Shortener

## Descripción General

El sistema de analytics proporciona insights detallados sobre el rendimiento de las URLs acortadas, incluyendo métricas de clics, datos geográficos, información de dispositivos y más.

## Características Implementadas

### Backend Analytics (✅ Completado)

#### 1. Servicio de Analytics
- **Archivo**: `backend/src/services/analyticsService.ts`
- **Funcionalidades**:
  - Dashboard analytics con métricas generales
  - Analytics específicos por URL
  - Comparaciones de períodos
  - Datos geográficos (país, ciudad)
  - Información de dispositivos y navegadores
  - Análisis de referrers

#### 2. Rutas de API
- **Archivo**: `backend/src/routes/analytics.ts`
- **Endpoints**:
  - `GET /api/analytics/dashboard` - Analytics generales del dashboard
  - `GET /api/analytics/urls/:id` - Analytics de URL específica
  - `GET /api/analytics/export` - Exportar datos de analytics

### Frontend Analytics (✅ Completado)

#### 1. Tipos de TypeScript
- **Archivo**: `frontend/src/types/index.ts`
- **Interfaces**:
  - `DashboardAnalytics` - Datos del dashboard
  - `UrlAnalytics` - Datos específicos de URL
  - `AnalyticsSummary` - Resumen de métricas
  - `ClicksOverTime` - Datos de clics por tiempo
  - `GeoData` - Datos geográficos
  - `DeviceData`, `BrowserData`, `ReferrerData` - Datos de tecnología

#### 2. Servicio Frontend
- **Archivo**: `frontend/src/services/analyticsService.ts`
- **Funciones**:
  - `getDashboardAnalytics()` - Obtener analytics del dashboard
  - `getUrlAnalytics()` - Obtener analytics de URL específica
  - `exportAnalytics()` - Exportar datos

#### 3. Custom Hooks
- **Archivo**: `frontend/src/hooks/useAnalytics.ts`
- **Hooks**:
  - `useAnalytics()` - Hook para analytics del dashboard
  - `useUrlAnalytics()` - Hook para analytics de URL específica
  - `useAnalyticsExport()` - Hook para exportar datos

#### 4. Componentes de UI
Todos los componentes están en `frontend/src/components/analytics/`:

##### 4.1 AnalyticsOverview
- **Propósito**: Tarjetas de resumen con métricas principales
- **Características**:
  - Métricas totales (URLs, clics, clics únicos)
  - Comparaciones con período anterior
  - Indicadores de cambio con colores

##### 4.2 ClicksChart
- **Propósito**: Gráfico de líneas para clics en el tiempo
- **Características**:
  - Líneas para clics totales y únicos
  - Vista responsive
  - Tooltips informativos

##### 4.3 GeographicChart
- **Propósito**: Visualización de datos geográficos
- **Características**:
  - Top países y ciudades
  - Barras de progreso con porcentajes
  - Diseño tabular responsive

##### 4.4 TechnologyChart
- **Propósito**: Análisis de dispositivos, navegadores y referrers
- **Características**:
  - Tres secciones: dispositivos, navegadores, referrers
  - Gráficos de barras con porcentajes
  - Diseño en grid responsive

##### 4.5 TopUrlsTable
- **Propósito**: Tabla de URLs más populares
- **Características**:
  - Información completa de URLs
  - Métricas de rendimiento
  - Botones de acción (ver detalles, copiar)
  - Paginación y ordenamiento

##### 4.6 PeriodSelector
- **Propósito**: Selector de período de tiempo
- **Características**:
  - Opciones: 7d, 30d, 90d, 1y
  - Interfaz de dropdown
  - Estado activo visual

##### 4.7 UrlAnalyticsOverview
- **Propósito**: Resumen específico para analytics de URL individual
- **Características**:
  - Métricas específicas de URL
  - Información de timeline
  - Estado de actividad

#### 5. Páginas de Dashboard

##### 5.1 Dashboard Analytics Principal
- **Archivo**: `frontend/app/(dashboard)/analytics/page.tsx`
- **Características**:
  - Vista completa del dashboard
  - Todas las métricas y gráficos
  - Funcionalidad de exportación
  - Navegación a detalles de URLs

##### 5.2 Analytics de URL Individual
- **Archivo**: `frontend/app/(dashboard)/analytics/urls/[urlId]/page.tsx`
- **Características**:
  - Vista detallada de URL específica
  - Información completa de la URL
  - Métricas específicas
  - Navegación de regreso

## Estructura de Datos

### Dashboard Analytics
```typescript
{
  summary: {
    totalUrls: number;
    totalClicks: number;
    uniqueClicks: number;
    clicksInPeriod: number;
    avgClicksPerUrl: number;
    clickRate: number;
  };
  comparison: {
    clicks: PeriodComparison;
    uniqueClicks: PeriodComparison;
    urls: PeriodComparison;
  };
  charts: {
    clicksOverTime: ClicksOverTime[];
    topUrls: TopUrl[];
    topCountries: GeoData[];
    topCities: GeoData[];
    topReferrers: ReferrerData[];
    topDevices: DeviceData[];
    topBrowsers: BrowserData[];
  };
}
```

### URL Analytics
```typescript
{
  url: {
    id: string;
    shortCode: string;
    originalUrl: string;
    title?: string;
    createdAt: Date | string;
  };
  summary: {
    totalClicks: number;
    uniqueClicks: number;
    avgClicksPerDay: number;
    peakDay: { date: string; clicks: number };
    firstClick?: Date | string;
    lastClick?: Date | string;
  };
  charts: {
    // Similar structure to dashboard
  };
}
```

## Navegación

El sistema está integrado en el dashboard principal con:
- Enlace en la navegación principal: `/dashboard/analytics`
- Navegación a detalles de URL: `/dashboard/analytics/urls/[urlId]`
- Breadcrumbs y navegación de regreso

## Funcionalidades de Usuario

### 1. Dashboard Principal
- Ver métricas generales de todas las URLs
- Filtrar por período de tiempo (7d, 30d, 90d, 1y)
- Exportar datos en formato CSV
- Navegar a detalles de URLs específicas

### 2. Analytics de URL Individual
- Ver métricas específicas de una URL
- Comparar rendimiento por períodos
- Analizar patrones de clics
- Información geográfica y de dispositivos

### 3. Características Interactivas
- Gráficos interactivos con tooltips
- Tablas ordenables y navegables
- Botones de copia para URLs
- Estados de carga y error manejados
- Diseño responsive para móviles

## Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Next.js 15** (App Router)
- **Tailwind CSS** para estilos
- **Custom Hooks** para gestión de estado
- **Fetch API** para comunicación con backend

### Backend
- **Express.js** con TypeScript
- **Prisma ORM** para base de datos
- **PostgreSQL** para almacenamiento
- **User-Agent parsing** para detección de dispositivos
- **Geolocalización** por IP

## Estados y Manejo de Errores

### Estados de Carga
- Skeleton loaders durante carga inicial
- Indicadores de carga para acciones específicas
- Estados de "sin datos" cuando corresponde

### Manejo de Errores
- Mensajes de error claros y accionables
- Botones de reintento
- Fallbacks para datos faltantes
- Validación de parámetros

## Consideraciones de Rendimiento

### Optimizaciones Frontend
- Lazy loading de componentes grandes
- Memorización de componentes con React.memo
- Debouncing en actualizaciones de período
- Paginación en tablas grandes

### Optimizaciones Backend
- Índices de base de datos en campos frecuentes
- Agregaciones eficientes con Prisma
- Caché de datos geográficos
- Límites en consultas de rango de fechas

## Próximas Mejoras Sugeridas

1. **Gráficos más Avanzados**
   - Integrar Chart.js o Recharts
   - Gráficos de mapas para datos geográficos
   - Gráficos de tiempo real

2. **Analytics Avanzados**
   - Tasas de conversión
   - Análisis de funnels
   - Segmentación de usuarios
   - A/B testing de URLs

3. **Exportación Mejorada**
   - Múltiples formatos (PDF, Excel)
   - Reportes programados
   - Dashboards personalizados

4. **Integraciones**
   - Google Analytics
   - Webhooks para eventos
   - APIs de terceros para datos adicionales

## Instalación y Configuración

### Backend
1. Las dependencias ya están instaladas
2. La migración de base de datos está aplicada
3. El servicio de analytics está activo

### Frontend
1. Todos los componentes están creados
2. Las rutas están configuradas
3. Los tipos están definidos

### Uso
1. Navegar a `/dashboard/analytics`
2. Seleccionar período de tiempo
3. Explorar métricas y gráficos
4. Hacer clic en URLs para ver detalles

El sistema está completamente funcional y listo para uso en producción.
