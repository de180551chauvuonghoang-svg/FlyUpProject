# Codebase Summary

This document provides a high-level summary of the FlyUp EduTech codebase based on the latest architectural changes and feature implementations.

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
- `src/utils/`: Helper functions and utilities including AI providers.
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
| `backend/src/lib/redis.js` | Configures Redis connection for caching and safe access helpers. |
| `backend/src/lib/queue.js` | Configures BullMQ for background tasks. |
| `backend/src/utils/ai-providers/groq-client.js` | Singleton client for Groq AI with memory-safe completion helpers. |
| `frontend/src/App.jsx` | Defines the application routes and layout. |
| `frontend/src/contexts/AuthContext.jsx` | Manages global authentication state. |
| `frontend/vite.config.js` | Vite build configuration including Tailwind integration. |

## Key Technologies

### Backend
- **Framework:** Express.js (ES Modules)
- **ORM:** Prisma
- **Database:** PostgreSQL (via Supabase)
- **Caching/Queue:** Redis, BullMQ
- **AI:** Groq SDK (`llama-3.3-70b-versatile`), Google Generative AI
- **Auth:** JWT, Supabase JS

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS, DaisyUI
- **State Management:** Context API, TanStack Query
- **Routing:** React Router DOM
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Recent Architectural Improvements
- **Memory Safety**: Implemented strict timeout cleanup in AI and Redis clients to prevent long-term memory leaks from un-cleared timers.
- **Enhanced Rate Limiting**: Added granular rate limits for AI-powered endpoints (Chatbot: 10 req/min standard, 5 req/min streaming) to ensure service stability.
- **Streaming Support**: Implemented SSE (Server-Sent Events) for real-time AI chatbot responses.
- **Distributed Caching**: Integrated Redis for performance optimization across course searches and AI recommendation services.

---
*Last Updated: 2026-02-12*
