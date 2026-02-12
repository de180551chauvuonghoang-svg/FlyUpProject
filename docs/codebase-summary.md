# Codebase Summary

## High-Level Overview
FlyUp EduTech is a full-stack application following a monorepo-style structure with separate `backend` and `frontend` directories. It utilizes a modern JavaScript/Node.js stack with Express.js on the backend and React on the frontend.

## Directory Structure

### Root Directory
- `backend/`: Node.js Express server and database logic.
- `frontend/`: React Vite application.
- `docs/`: Technical documentation and guides.
- `plans/`: Implementation plans and progress reports.
- `*.sql`: Database schema snapshots.
- `*.md`: Legacy documentation in Vietnamese.

### Backend (`/backend`)
- `src/index.js`: Main entry point.
- `src/configs/`: Configuration for Supabase, Swagger, etc.
- `src/controllers/`: Request handlers (Auth, Course, Chatbot, etc.).
- `src/lib/`: Library initializations (Prisma, Redis, Queue).
- `src/middleware/`: Express middleware (Auth, Rate Limiting, Validation).
- `src/routers/`: API route definitions.
- `src/services/`: Business logic layer.
- `src/utils/`: Helper functions and utilities.
- `src/workers/`: Background job workers (Email).
- `prisma/`: Database schema and migration files.

### Frontend (`/frontend`)
- `src/main.jsx`: Application entry point.
- `src/App.jsx`: Root component and routing.
- `src/components/`: Reusable UI components.
- `src/contexts/`: State management via Context API (Auth, Cart).
- `src/hooks/`: Custom React hooks (useAuth, useCart, etc.).
- `src/pages/`: Page-level components (Home, CourseDetails, etc.).
- `src/services/`: API integration services.
- `src/utils/`: Frontend utility functions and constants.

## Key Files and Purposes

| File | Purpose |
| :--- | :--- |
| `backend/prisma/schema.prisma` | Defines the database models and relationships. |
| `backend/src/index.js` | Sets up the Express server and integrates middleware. |
| `backend/src/lib/redis.js` | Configures Redis connection for caching. |
| `backend/src/lib/queue.js` | Configures BullMQ for background tasks. |
| `frontend/src/App.jsx` | Defines the application routes and layout. |
| `frontend/src/contexts/AuthContext.jsx` | Manages global authentication state. |
| `frontend/vite.config.js` | Vite build configuration including Tailwind integration. |

## Dependencies Overview

### Backend
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL (via Supabase)
- **Caching/Queue:** Redis, BullMQ
- **AI:** Groq SDK, Google Generative AI
- **Auth:** JWT, Supabase JS

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS, DaisyUI
- **State Management:** Context API, TanStack Query
- **Routing:** React Router DOM
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Build and Deployment Processes
- **Backend:** `npm run dev` for development (Nodemon); `node src/index.js` for production.
- **Frontend:** `npm run dev` for development; `npm run build` generates a production-ready `dist` folder.
- **Environment:** Both rely heavily on `.env` files for secrets and configuration.

---
*Last Updated: 2026-02-12*
