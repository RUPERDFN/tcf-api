# TCF API - TheCookFlow Backend

## Overview

TheCookFlow (TCF) API is a meal planning and menu management backend service built with Express.js and TypeScript. The application helps users plan weekly menus, manage shopping lists, track completed meals, and includes a gamification system with points, levels, and badges to encourage consistent meal planning habits.

The API serves as the backend for a meal planning application, integrating with an external service called "SkinChef" for AI-powered menu generation based on user dietary preferences, budget constraints, and household size.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Framework
- **Express.js with TypeScript**: Chosen for type safety, mature ecosystem, and straightforward REST API development
- **ES Modules**: Uses modern JavaScript module syntax (`"type": "module"` in package.json)
- **TSX for development**: Hot-reloading during development via `tsx watch`

### Database Layer
- **PostgreSQL**: Primary database for all persistent storage
- **Drizzle ORM**: Type-safe database access with schema defined in `drizzle/schema.ts`
- **Connection handling**: Supports both individual PG environment variables and `DATABASE_URL` connection string
- **Schema includes**: users, profiles, menus, completed_meals, gamification, points_log, shopping_items, password_reset_tokens

### Authentication & Security
- **JWT-based authentication**: Tokens signed with `JWT_SECRET`, 7-day expiration
- **bcrypt password hashing**: Configurable rounds via `BCRYPT_ROUNDS` environment variable
- **Helmet.js**: Security headers middleware
- **CORS**: Configured for localhost development and production domains (thecookflow.com)
- **Rate limiting**: 100 requests per 15-minute window using express-rate-limit

### API Structure
Routes are organized by domain under `/api`:
- `/api/auth` - Registration, login, password reset, session management
- `/api/users` - User profiles and dietary preferences
- `/api/menus` - Menu generation, meal swapping, completion tracking
- `/api/shopping` - Shopping list management with PDF/text export
- `/api/gamification` - Points, levels, badges, and leaderboards

### Request Validation
- **Zod schemas**: All request bodies validated in `validation.middleware.ts`
- **Error handling**: Centralized error handler converts Zod errors and database constraint violations to user-friendly messages

### Code Organization Pattern
```
src/
├── config/          # Database and environment configuration
├── controllers/     # Request handlers (one per domain)
├── middleware/      # Auth, validation, error handling
├── routes/          # Express router definitions
├── services/        # External service integrations
└── types/           # TypeScript interfaces
```

## External Dependencies

### Database
- **PostgreSQL**: Required for data persistence
- Environment variables: `DATABASE_URL` or individual `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### External Services
- **SkinChef Service**: AI menu generation service at `SKINCHEF_URL` (defaults to localhost:3002)
  - Generates personalized weekly menus based on dietary preferences
  - Provides recipe details and shopping lists
  - Handles meal substitutions

### Email Service
- **SMTP Integration**: Optional email sending for welcome messages and notifications
- Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Gracefully degrades if not configured (logs instead of sending)

### Required Environment Variables
- `JWT_SECRET` - **Required** - Secret for signing JWT tokens
- `DATABASE_URL` - PostgreSQL connection string
- `SKINCHEF_URL` - Menu generation service endpoint
- `CORS_ORIGINS` - Comma-separated allowed origins

### NPM Dependencies
- **Runtime**: express, drizzle-orm, pg, jsonwebtoken, bcrypt, zod, pdfkit, helmet, cors, morgan, pino
- **Development**: tsx, typescript, type definitions