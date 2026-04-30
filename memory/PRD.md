# PitchPro — PRD

## Vision (updated Apr 30 2026)
PitchPro is **a multi-tenant platform** that powers cricket academies. Academy owners onboard their academy; coaches and parents register under an academy. The platform provides every academy with lane bookings, 1-on-1 coaching, kids' progress reports, weekend matches, fees, and parent communication.

## Iteration 3 user feedback
1. Reframe PitchPro as a platform that hosts multiple academies (not a single academy).
2. Restore dark theme (move on from the pastel exploration).
3. **Curved blocks** everywhere (rounded corners, modern app feel).
4. Add a **runtime theme switcher dropdown** in nav with multiple dark options.
5. More modern look and appeal overall.

## Architecture
- Backend: FastAPI single `server.py` + Motor (MongoDB) + JWT cookies + bcrypt.
- Frontend: React 19 + Tailwind + Shadcn UI + Recharts + Sonner + custom ThemeContext.
- Theme tokens via CSS variables, switched at runtime via `data-theme` attribute on `<html>` (persisted in localStorage).

## Data model
- `academies` (new): id, name, slug, tagline, description, city, address, phone, email, photo_url, accent_color.
- `users`: id, email, name, role (admin / coach / user), academy_id, academy_name, kids[].
- Existing collections: lanes, bookings, coaches, sessions, progress, games, announcements, fees, notifications, awards.

## Theme system (runtime switcher in nav)
1. **Stadium** — leather red + pitch green (default).
2. **Midnight** — sky blue + lavender, cool navy bg.
3. **Carbon** — amber + lime on charcoal.
4. **Forest** — emerald + warm yellow on deep forest.

`--radius` set to **1rem**, with **rounded-2xl / rounded-3xl / rounded-full** used throughout (cards, inputs, buttons). Result: modern, soft, app-like feel.

## Implemented (POC, Apr 30 2026)
### Frontend (latest)
- **Split login**: separate `/login` (Player & Parent) and `/academy/login` (Academy admin + Platform admin tabs).
- **Public navbar** is now platform-only — Home / Academies / Platform. Coaches / Games / Academy links are hidden until a user is signed in. Two distinct CTAs in the header: "Player login" and "Academy login".
- Each login page cross-links to the other, and prefills its own demo credentials.
- Mobile menu mirrors the same split (Player login, Academy login, Sign up CTAs).

### Backend
- All iteration 1 & 2 endpoints unchanged.
- Iteration 3 additions:
  - `GET /api/academies` (public) — list with player/lane/coach counts.
  - `GET /api/academies/{id}` (public) — details.
  - `POST /api/academies` (admin) — create academy.
  - `RegisterIn.academy_id` accepted; first-academy fallback if not provided.
  - `seed_academies()` — 3 sample academies (Crease, Boundary Line, Stumps & Co.).
  - Backfills existing seeded users with first academy.

### Frontend
- New `ThemeContext` + `ThemeSwitcher` (Shadcn dropdown in navbar).
- New rounded utility classes: `panel-soft`, `panel-glow`.
- Landing reframed: hero "One platform. Every academy. Every player." + stats strip + featured academies grid + bento modules + CTA "Run an academy?".
- Register form: academy picker dropdown (loads from `/api/academies`, deep-link state from academy card).
- Login: rounded pill toggle (Parent/Academy), rounded-2xl inputs, rounded-full primary button.
- Navbar: rounded brand mark, theme switcher pill, rounded-full CTAs, rounded-2xl avatar dropdown.

## Test credentials
- Admin: admin@cricketacademy.com / Admin@12345 (Crease Cricket Academy)
- Parent: user@cricketacademy.com / User@12345 (Crease Cricket Academy)
- Coach: coach@cricketacademy.com / Coach@12345 (Crease Cricket Academy)

## Backlog
### P1
- Real email + WhatsApp providers (Resend + Twilio).
- Scope all queries to `user.academy_id` (lanes/coaches/games are still shared in this POC).
- Per-academy admin role: academy_admin (vs platform admin).
- Coach self-dashboard (link `users.coach_id` → coach record).
- Profile page (edit kids list, name, phone).
- Forgot/reset password.

### P2
- Stripe payment for fees.
- White-label per academy (use `accent_color` + logo as theme override).
- Galleries, equipment store, league standings.
- Mobile app shells (PWA + Capacitor wrappers for iOS/Android).
