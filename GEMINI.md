## Project Overview

**Open URL Shortener** is a production-ready, full-stack URL shortening service built with Express.js backend and Next.js frontend. The project includes advanced features like analytics, Stripe subscription management, and JWT authentication with refresh tokens.

**Current Status**: ~95% complete, ready for production deployment with minor configuration needed.

## Development Commands

### Backend (Express.js + TypeScript + Prisma)
```bash
cd backend

# Development
npm run dev                    # Start development server on port 3001
npm test                       # Run Jest tests

# Database
npx prisma migrate dev         # Apply database migrations
npx prisma generate           # Generate Prisma client
npx prisma studio             # Open Prisma Studio database viewer

# Testing specific files
npm test -- --testNamePattern="stripe"
npm test -- --watch
```

### Frontend (Next.js 15 + React 19 + TypeScript)
```bash
cd frontend

# Development
npm run dev                    # Start development server on port 3000
npm run build                  # Production build
npm run start                  # Start production server

# Quality checks
npm run lint                   # ESLint check
npm run lint:fix              # ESLint fix
npm run type-check            # TypeScript compilation check

# Testing
npm test                      # Run Jest tests
npm test:watch               # Watch mode
npm test:coverage            # Coverage report
```

## Architecture Overview

### Backend Architecture (`/backend/src/`)

**Core Structure**:
- `app.ts` - Express app configuration with security middleware
- `routes/` - API route handlers organized by domain
- `services/` - Business logic and external service integrations  
- `middleware/` - Authentication, rate limiting, validation
- `utils/` - Shared utilities and constants
- `prisma/` - Database schema and migrations

**Key API Routes**:
- `/api/auth` - JWT authentication with refresh tokens
- `/api/urls` - URL CRUD operations with plan-based limits
- `/api/analytics` - Comprehensive metrics and dashboard data
- `/api/health` - System monitoring endpoints
- `/api/stripe` - Subscription and payment management
- `/api/webhooks` - Stripe webhook processing
- `/:shortCode` - URL redirection with click tracking

**Authentication Flow**:
Uses dual-token JWT system with access tokens (15min) and refresh tokens (7 days). Middleware automatically handles token refresh in `auth.ts`.

**Database Models** (Prisma):
- User → URLs (1:many), Subscriptions (1:1), RefreshTokens (1:many)
- URL → Clicks (1:many) with analytics data
- Click → stores IP, user agent, country, city, device, browser
- Subscription → Stripe integration with plan limits

### Frontend Architecture (`/frontend/src/`)

**Structure**:
- `app/` - Next.js 15 App Router pages and layouts
- `components/` - Reusable UI components organized by domain
- `services/` - API client with automatic token refresh
- `store/` - Zustand state management (auth, URLs)
- `hooks/` - Custom React hooks for data fetching
- `types.ts` - TypeScript definitions

**State Management**:
- `authStore` (Zustand) - User authentication and tokens
- `useDashboardData` - Custom hook for analytics data
- React Query integration planned for server state

**API Client** (`apiService.ts`):
- Axios instance with automatic token refresh
- Request/response interceptors for auth
- Type-safe API methods for each backend route
- Automatic redirect to login on auth failure

## Configuration Requirements

### Environment Variables

**Backend `.env`**:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="secure-secret-key"
JWT_REFRESH_SECRET="another-secure-secret"
FRONTEND_URL="http://localhost:3000"
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

**Frontend `.env.local`**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### First-time Setup
1. Create environment files above
2. Run `cd backend && npx prisma migrate dev` to create database
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`

## Development Guidelines

### Testing Strategy
- **Backend**: Jest with supertest for API integration tests
- **Frontend**: Jest + React Testing Library for component tests
- Tests run with `npm test` in respective directories
- Current status: 90% of backend tests passing (some expectation mismatches)

### Code Organization Patterns
- **Route Handlers**: Validate input → Check auth → Call service → Return response
- **Services**: Contain business logic, database operations, external API calls
- **Components**: Functional React components with TypeScript props
- **Hooks**: Custom hooks for data fetching and state management

### API Response Format
```typescript
// Success
{ data: T, message?: string }

// Error  
{ error: string, message?: string, details?: any }
```

### Database Patterns
- All models use `cuid()` IDs
- Soft deletes with `isActive` boolean
- Created/updated timestamps on all models
- Foreign key relationships with proper cascade behavior

## Known Issues & TODOs

### Critical (blocking production):
- Database migrations not applied (run `npx prisma migrate dev`)
- Environment variables not configured

### Non-critical (future enhancements):
- User management API (`/api/users`) - commented out in `app.ts:42`
- Custom domains API (`/api/domains`) - commented out in `app.ts:43`  
- Email service uses mock implementation (`services/emailService.ts`)
- Toast notifications incomplete (`UrlForm.tsx:135`)

### Test Issues:
- Some backend tests fail due to expectation vs implementation differences
- Frontend test coverage could be expanded

## Integration Points

**Stripe Integration**:
- Webhook handling for subscription events
- Plan limits enforced in URL creation
- Customer and subscription management

**Analytics System**:
- Click tracking on URL redirection
- Comprehensive dashboard metrics
- Geographic and device analytics

**Security Features**:
- Rate limiting on all routes
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- Password hashing with bcryptjs