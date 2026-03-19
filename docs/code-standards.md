# Code Standards and Implementation Guidelines

## Codebase Structure Standards
FlyUp project follows a modular architecture separating concerns between the presentation layer (Frontend) and the business logic layer (Backend).

### Backend Organization
- **Controllers:** Handle HTTP requests and responses only.
- **Services:** Contain the core business logic and database interactions.
- **Routers:** Map URL paths to specific controllers.
- **Middleware:** Cross-cutting concerns like authentication, validation, and rate limiting.
- **Lib:** Initialization of external services/drivers.

### Frontend Organization
- **Pages:** Top-level components mapped to routes.
- **Components:** Atomic and molecular UI pieces.
- **Contexts:** Global state management.
- **Hooks:** Shared logic between components.
- **Services:** External API communication.

## File Naming Conventions
- **JavaScript/React Files:** use `camelCase.js` or `PascalCase.jsx` for components.
- **Utility Files:** `kebab-case.js`.
- **Styles:** `index.css` or component-specific CSS.
- **Documentation:** `kebab-case.md`.

## Code Organization Patterns
- **Composition over Inheritance:** Use React components and composition for UI.
- **Service Layer Pattern:** Keep controllers thin by moving logic to services.
- **Singleton Pattern:** Used for database and redis connections in `lib/`.

## Import/Export Conventions
- Use ES Modules (`import`/`export`) throughout the project.
- Group imports:
  1. Built-in modules
  2. External dependencies
  3. Internal modules
  4. Styles/Assets

## State Management Patterns
- **Global State:** React Context API for relatively static data (Auth, Cart).
- **Server State:** TanStack Query for caching and syncing data from the API.
- **Local State:** `useState` and `useReducer` for component-specific logic.

## API Design Patterns
- **RESTful Principles:** Use appropriate HTTP methods (GET, POST, PUT, DELETE).
- **JSON Standard:** All responses should return JSON.
- **Error Consistency:** Standardized error response format: `{ error: "Message", code: 400 }`.

## Error Handling Standards
- **Backend:** Use `try-catch` blocks in services and controllers. Pass errors to Express error handling middleware or return specific status codes.
- **Frontend:** Use error boundaries and `try-catch` within hooks/services. Provide user feedback via `react-hot-toast`.

## Testing Standards
- Unit tests for utility functions.
- Integration tests for critical API paths.
- (Recommended) Use Vitest or Jest.

## Comments and Documentation
- Use JSDoc for complex functions and hooks.
- Keep comments meaningful; avoid stating the obvious.
- Update `docs/` folder for any architectural or significant logic changes.

---
*Last Updated: 2026-02-12*
