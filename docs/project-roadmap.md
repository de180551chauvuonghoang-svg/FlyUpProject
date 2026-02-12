# Project Roadmap

## Current Status: Beta
FlyUp EduTech has a functional core encompassing user authentication, course management, and a checkout system. The AI chatbot is integrated and operational.

## Development Phases

### Phase 1: Foundation (Completed)
- [x] Initial backend setup with Express and Prisma.
- [x] PostgreSQL database schema design.
- [x] Basic frontend structure with React and Vite.
- [x] Authentication system (JWT + OAuth).

### Phase 2: Core Features (Completed)
- [x] Course browsing and details pages.
- [x] Shopping cart and checkout flow.
- [x] Enrollment logic.
- [x] User profile and transaction history.
- [x] AI Chatbot integration.

### Phase 3: Optimization & Refinement (In Progress)
- [x] Redis caching implementation.
- [x] BullMQ for background email processing.
- [x] AI Service Critical Fixes (Memory Leaks & Rate Limiting).
- [ ] Improved search and filtering for courses.
- [ ] Enhanced instructor dashboard.
- [x] Documentation overhaul (Updated).

### Phase 4: Expansion (Planned)
- [ ] Mobile application (React Native).
- [ ] Live streaming for instructor sessions.
- [ ] Gamification (Badges, Streaks).
- [ ] Multi-tenant support for educational institutions.

## Known Issues and Tech Debt
- **Legacy Docs:** Many internal documents are currently in Vietnamese and need translation/update.
- **Test Coverage:** Need more comprehensive unit and integration tests.
- **Frontend Refactoring:** Some large components in `src/pages` exceed the 200-line recommended limit.
- **Rate Limiting:** Needs tuning for production environments.

## Future Enhancements
- Integration of specialized AI models for code review and automated grading.
- Advanced analytics for instructors to track student progress.
- Peer-to-peer messaging system for students.

---
*Last Updated: 2026-02-12*
