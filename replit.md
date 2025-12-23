# TheCookFlow

## Overview

TheCookFlow is a full-stack meal planning and cooking workflow application. It helps users manage weekly menus, generate shopping lists, track cooking achievements, and handle subscriptions. The app features a React frontend with a warm culinary theme and an Express backend with PostgreSQL database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for local state, TanStack Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with a custom warm culinary theme (terracotta/beige palette)
- **Animations**: Framer Motion for page transitions and micro-interactions

The frontend follows a page-based structure with protected routes requiring authentication. The design uses a serif font (Playfair Display) for headings and Inter for body text.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Structure**: RESTful endpoints organized by domain (auth, profile, menus, shopping, subscriptions, achievements, stats, events)
- **Security**: Helmet for HTTP headers, CORS configuration, rate limiting on auth and general endpoints
- **Validation**: Zod schemas for request validation

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL or individual PG* environment variables)
- **Schema**: Users, user profiles, menus (JSONB for meal data), shopping lists, subscriptions, achievements, user stats, and analytics events
- **Migrations**: Drizzle Kit for schema management

### Key Design Patterns
- Shared schema types between frontend and backend via the `shared/` directory
- Path aliases (@/ for client, @shared/ for shared code)
- Environment-based configuration with validation
- Structured logging with Pino
- Error handling middleware with Zod error parsing

## External Dependencies

### Database
- PostgreSQL database (required, configured via DATABASE_URL environment variable)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `CORS_ORIGINS` - Comma-separated allowed origins (optional)
- `OPENAI_API_KEY` - For AI features (optional, integration with SkinChef service)

### Third-Party Services
- No external payment processor currently integrated (subscription endpoints exist but Stripe integration is prepared via dependencies)
- OpenAI/AI integration planned for menu generation

### Key NPM Dependencies
- Frontend: React, Wouter, TanStack Query, Framer Motion, shadcn/ui components
- Backend: Express, Drizzle ORM, pg, bcrypt, jsonwebtoken, Zod, Pino
- Shared: Zod for validation schemas