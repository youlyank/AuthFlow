# Authflow Design Guidelines

## Design Approach

**Selected Approach**: Design System - Material Design + Linear/Stripe Dashboard Patterns

**Justification**: As an enterprise authentication platform competing with Auth0, Okta, and Keycloak, Authflow requires a professional, trustworthy interface that prioritizes clarity, efficiency, and data density. The combination of Material Design principles with modern enterprise dashboard patterns (Linear's clean aesthetics + Stripe's data visualization) creates a credible yet developer-friendly experience.

**Key Design Principles**:
- **Trust & Security First**: Visual design must convey enterprise-grade reliability
- **Information Clarity**: Dense data presented with clear hierarchy and scanability
- **Efficient Workflows**: Minimize clicks, maximize productivity for admin tasks
- **Consistent Patterns**: Predictable UI reduces cognitive load across complex features

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary Brand: 217 91% 60% (vibrant blue - trust, security, technology)
- Primary Hover: 217 91% 50%
- Secondary: 270 60% 50% (purple accent - sparingly for highlights)
- Background: 0 0% 100% (pure white)
- Surface: 220 13% 98% (subtle gray for cards)
- Border: 220 13% 91% (light gray dividers)
- Text Primary: 220 13% 13% (near black)
- Text Secondary: 220 9% 46% (medium gray)
- Success: 142 71% 45% (green for active states)
- Warning: 38 92% 50% (amber for warnings)
- Error: 0 84% 60% (red for errors)
- Info: 199 89% 48% (cyan for notifications)

**Dark Mode**:
- Primary Brand: 217 91% 60% (same vibrant blue)
- Primary Hover: 217 91% 70%
- Secondary: 270 60% 60%
- Background: 220 13% 9% (dark slate)
- Surface: 220 13% 13% (elevated cards)
- Border: 220 13% 20% (subtle borders)
- Text Primary: 0 0% 98% (near white)
- Text Secondary: 220 9% 65% (muted gray)
- Success/Warning/Error/Info: Same hues, adjusted lightness for dark mode contrast

### B. Typography

**Font Families**:
- Primary: "Inter" (Google Fonts) - for UI, body text, data tables
- Monospace: "JetBrains Mono" - for API keys, code snippets, logs

**Type Scale**:
- Headings: H1 (text-4xl font-bold), H2 (text-3xl font-semibold), H3 (text-2xl font-semibold)
- Body: Base (text-base), Small (text-sm), XS (text-xs)
- Data/Tables: text-sm for optimal density
- Labels: text-sm font-medium uppercase tracking-wide

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Card spacing: p-6
- Form field gaps: space-y-4
- Dashboard grids: gap-6

**Grid System**:
- Dashboard layouts: 12-column grid with responsive breakpoints
- Super Admin: Sidebar (w-64) + Main (flex-1)
- Analytics cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- User tables: Full-width with sticky headers

### D. Component Library

**Navigation**:
- Persistent sidebar (Super Admin/Tenant Admin): Dark surface with icon + label navigation, active state with accent border-l-4
- Top bar: Logo, tenant switcher (Super Admin), user menu, notification bell
- Breadcrumbs: For deep navigation hierarchies

**Data Display**:
- Tables: Striped rows (hover:bg-surface), sortable headers, inline actions, pagination
- Cards: Elevated surface with rounded-lg, shadow-sm, border
- Stats/Metrics: Large numbers (text-3xl font-bold) with trend indicators (↑↓ arrows, percentage change)
- Charts: Use Chart.js/Recharts with brand colors, subtle grid lines, clear legends

**Forms & Inputs**:
- Text fields: border-2 focus:border-primary, rounded-lg, p-3
- Dropdowns: Custom styled with Headless UI, searchable for long lists
- Toggle switches: For binary settings (active/inactive, enabled/disabled)
- Multi-select: Checkboxes with "Select All" for bulk actions

**Dashboards**:
- Analytics overview: KPI cards in grid (4 columns desktop, 2 tablet, 1 mobile)
- Recent activity: Timeline/feed layout with timestamps, user avatars
- Quick actions: Prominent CTAs (Create User, Send Notification) in top-right

**Notification Center**:
- Dropdown panel (w-96) from top bar bell icon
- Grouped by: Unread (bold) → Today → Earlier
- Each notification: Icon (type-based color), message, timestamp, mark-as-read button
- Branded notifications: Show tenant logo (32x32) + custom accent color border-l-4

**Modals & Overlays**:
- Confirmation dialogs: Centered, max-w-md, clear action buttons (Cancel + Primary)
- Slide-overs: For detailed views (user profile, audit log details), w-1/3 from right
- Toasts: Top-right corner, auto-dismiss (success/error), icon + message

### E. Authentication Flows

**Login Page**:
- Centered card (max-w-md), brand logo top, form fields, social login buttons below
- "Forgot Password?" link subtle text-sm
- Dark mode toggle in top-right

**Registration**:
- Multi-step if needed (email → verify OTP → password), progress indicators
- Password strength meter with visual feedback

**MFA Setup**:
- QR code display (TOTP), backup codes in monospace grid
- Clear instructions with numbered steps

**Tenant Selection** (Super Admin):
- Grid of tenant cards with logo, name, plan badge, user count, quick "Switch" button

---

## Images

**Marketing/Landing Pages** (if created separately):
- **Hero Image**: Abstract 3D illustration of security/authentication (interconnected nodes, shield, digital locks) - full-width background with gradient overlay
- **Feature Showcases**: Dashboard screenshots with blurred sensitive data, clean product UI
- **Trust Indicators**: Partner/customer logos in grayscale, certification badges (SOC 2, ISO 27001)

**Dashboard/App** (minimal imagery):
- User avatars: Initials fallback with color based on name hash
- Empty states: Subtle illustrations (e.g., "No notifications" - bell icon with friendly message)
- Tenant logos: Display throughout interface for branding (32x32 to 64x64 sizes)

---

## Accessibility & Polish

- Maintain **WCAG AAA contrast ratios** (7:1 for text)
- Dark mode: Consistent across all components including form inputs, tables, modals
- Focus states: 2px ring-primary ring-offset-2 for keyboard navigation
- Loading states: Skeleton screens for tables/cards, spinners for buttons
- Error states: Inline validation with clear error messages (text-error)
- Animations: Subtle transitions (duration-200) for hover/focus, avoid distracting motion

---

## Competitive Differentiation

**vs Auth0**: Cleaner data density, better tenant management UX, more intuitive Super Admin controls

**vs Okta**: Modern visual language (not corporate-stale), developer-friendly with clear API documentation UI

**vs Keycloak**: Professional polish, cohesive design system, superior dashboard experience

**Unique Visual Identity**: Vibrant primary blue + clean typography + generous whitespace in dense interfaces = trustworthy yet modern enterprise tool