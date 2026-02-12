# Design Guidelines

## UI/UX Design Principles
- **Modern & Clean:** High contrast, rounded corners, and ample white space.
- **Accessibility:** Consistent use of ARIA labels and focus states.
- **Dark Mode First:** Default theme is dark-themed (`bg-[#0a0a14]`).

## Component Library
- **DaisyUI:** Utility-based component library built on top of Tailwind CSS.
- **Radix UI (Recommended):** For complex accessible components (Future).

## Styling Conventions
- **Tailwind CSS:** Primary tool for layout, spacing, and colors.
- **Themes:** Managed via `tailwind.config.js`. Primary color is purple/violet (`#9333ea`).
- **Standard Classes:**
  - Background: `bg-background-dark` or `bg-[#0a0a14]`.
  - Cards: `glass-card` with backdrop blur.
  - Text: `text-white` for titles, `text-gray-400` for descriptions.

## Responsive Design Approach
- **Mobile First:** Start with mobile layouts and expand using Tailwind's breakpoints (`md:`, `lg:`, `xl:`).
- **Navigation:** Mobile-responsive header with hamburger menu.
- **Grid Layouts:** Use CSS Grid for complex course listings and dashboard layouts.

## Animation Guidelines
- **Framer Motion:** Used for page transitions, hover effects, and scroll-triggered animations.
- **Scroll Animations:** Handled via custom hook `useScrollAnimation`.
- **Consistency:** Use standardized easing (e.g., `easeOutCubic`) for a fluid feel.

## Typography
- **Primary Font:** Spline Sans (Google Fonts).
- **Icons:** Lucide React and Material Symbols Outlined.

---
*Last Updated: 2026-02-12*
