# Deployment Guide

## Deployment Environments
- **Local:** Windows/Linux/macOS with Node.js 18+.
- **Database:** PostgreSQL (Cloud instance via Supabase).
- **Caching/Queue:** Redis (Cloud instance or local Docker).
- **Frontend Hosting:** Vercel (recommended) or Netlify.
- **Backend Hosting:** Render, Heroku, or AWS EC2.

## Environment Variables
The application requires the following environment variables (defined in `.env` files):

### Backend (.env)
```env
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your_jwt_secret
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GROQ_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
RESEND_API_KEY=...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build Process

### Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```

### Production Build
1. **Frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   This creates a `dist` folder ready for static hosting.
2. **Backend:**
   Ensure environment variables are set on the production server.
   Start the application:
   ```bash
   cd backend
   npm start
   ```

## Database Migrations
Prisma is used for database management. Always run `npx prisma generate` after changing the `schema.prisma` file and `npx prisma migrate deploy` in production environments.

## Monitoring and Logging
- **Console Logs:** Basic logging is used throughout the controllers.
- **External Tools:** (Planned) Integration with Sentry for error tracking and Winston/Bunyan for structured logging.

---
*Last Updated: 2026-02-12*
