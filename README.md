# FlyUp EduTech Platform

FlyUp is a modern, comprehensive educational technology platform designed to provide a seamless learning experience for students and powerful management tools for instructors.

## Key Features
- **Comprehensive Course Management:** Browse, search, and access detailed course content.
- **AI-Powered Learning:** Integrated chatbot assistant using Groq and Google AI for real-time help.
- **Secure Checkout:** Robust cart and payment system with transaction verification.
- **Learning Tracking:** Monitor progress through sections and lectures.
- **User Engagement:** Review and rating systems, wishlist, and interactive community features.
- **Performance Optimized:** Redis caching and background job processing with BullMQ.

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, DaisyUI, Framer Motion, TanStack Query.
- **Backend:** Node.js (ES Modules), Express.js, Prisma ORM.
- **Database:** PostgreSQL (Supabase).
- **Caching & Queue:** Redis, BullMQ.
- **AI Integration:** Groq SDK (Llama 3), Google Generative AI.
- **Authentication:** JWT, Supabase Auth (Google, GitHub OAuth).

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (or Supabase account)
- Redis instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/de180551chauvuonghoang-svg/FlyUpProject.git
   cd FlyUpProject
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup:**
   Create `.env` files in both `backend/` and `frontend/` directories based on the templates in the `docs/deployment-guide.md`.

4. **Database Setup:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

### Running the Application

From the root directory:
```bash
npm run dev
```
This will start both the backend (default: port 3000) and frontend (default: port 5173) concurrently.

## Project Structure Overview
```text
flyupproject/
├── backend/            # Express.js server & Prisma logic
│   ├── prisma/         # DB Schema & Migrations
│   └── src/            # API implementation
├── frontend/           # React 19 & Vite application
│   └── src/            # UI components & state management
├── docs/               # Technical documentation (English)
└── plans/              # Implementation plans & reports
```

## Detailed Documentation
For more in-depth information, please refer to the following files in the `docs/` directory:

- [Project Overview & PDR](./docs/project-overview-pdr.md)
- [Codebase Summary](./docs/codebase-summary.md)
- [System Architecture](./docs/system-architecture.md)
- [Code Standards](./docs/code-standards.md)
- [Deployment Guide](./docs/deployment-guide.md)
- [Design Guidelines](./docs/design-guidelines.md)
- [Project Roadmap](./docs/project-roadmap.md)

---
*License: ISC*
