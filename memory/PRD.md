# PitchPro Cricket Academy — PRD

## Original Problem Statement
Cricket Academy App with: browser-based + mobile-friendly UI, free DB & hosting, admin module, individual user accounts (email/password). Optional WhatsApp messages for announcements (mocked). Modules:
1. Cricket Lane Scheduling (book lanes, email confirmation, modify up to 24h before)
2. About Academy (about us, coach profiles, awards)
3. 1-1 Coaching Sessions (coach availability)
4. Kids Progress (weekly/monthly reports → email + in-app)
5. Weekly games (Sat/Sun) — team & ground location with GPS via email/WhatsApp.

### Iteration 2 user feedback (Apr 30 2026)
1. Change fonts (was Barlow Condensed/DM Sans → now **Oswald + Manrope**).
2. Rebrand the app to **"PitchPro"** everywhere.
3. Charts on the admin dashboard.
4. Two distinct sign-in flows:
   - **Academy login** (admin / coach) → Operations dashboard with lane usage + coach time-slot free/busy matrix.
   - **Parent login** (user) → Dashboard with child progress / matches / fees, all charted.

## Architecture
- Backend: FastAPI (single `server.py`) + Motor (async MongoDB) + JWT cookies + bcrypt.
- Frontend: React 19 + React Router 7 + Tailwind + Shadcn UI + Recharts + Sonner.
- Theme: dark "Performance Pro" — leather-red & pitch-green palette, **Oswald** display + **Manrope** body.

## User Personas
- **Parent (user)**: books lanes, schedules 1-1 coaching, tracks kids' progress, sees matches & fees.
- **Coach**: works in Operations view (lane + coach availability matrix); creates progress reports, games, announcements.
- **Admin**: super privileges — manages lanes/coaches/users/fees/games/announcements, sees Control Room with charts.

## Implemented (Apr 2026)

### Backend (`/app/backend/server.py`)
**Iteration 1**
- Auth: register / login / me / logout / refresh, brute-force lockout, bcrypt, httpOnly cookies, role-aware.
- Lanes, Coaches (with awards), Bookings (24h modify rule + conflict check), 1-1 Sessions (day & hour validation), Progress reports, Games + `/notify` (mocked email + WhatsApp + in-app), Announcements (mocked broadcast), Notifications, Awards, Admin (stats + users).
- Seed: admin, sample user (with 2 kids), sample coach, 5 lanes, 3 coaches, 4 awards, 2 weekend games.

**Iteration 2**
- Fees CRUD (admin) + `/api/fees/me` (parent view) + `/api/fees/{id}/mark-paid`.
- Admin charts: `/api/admin/charts` (timeseries 14d, lanes, coaches, roles).
- Operations dashboards: `/api/staff/lane-usage` and `/api/staff/coach-usage` for any date.
- Demo activity seed: 12 past bookings, ~10 past sessions, 3 fees, 3 weekly progress reports.
- CORS hardening: explicit allow_origins list.

### Frontend pages
- Landing — PitchPro hero with stadium bg, marquee, feature bento, CTA.
- Login — **Parent / Academy role toggle**, role-aware redirect.
- Register — Parent sign-up.
- About — academy story + values + awards.
- Coaches — profile grid with bios + awards + "Book 1-1".
- Games — public schedule with rosters & map.
- Dashboard (Parent) — KPI strip + Progress line chart + Fees pie + 8-week activity bar + tabs (Schedule, Progress, **Matches**, **Fees**, Inbox).
- BookLane — lane select + Shadcn calendar + slot chips + 24h policy.
- Coaching — coach select + availability calendar + slot chips.
- Admin (Control Room) — KPI strip + 5 charts (bookings/sessions area, revenue bars, lane utilisation, sessions-by-coach, member-roles pie) + 8 management tabs (Lanes, Coaches, Users, Bookings, Progress, **Fees**, Games, Announce).
- **Staff (Operations)** — 4 KPIs (lane/coach hrs free/busy) + date selector + lane-usage matrix + coach-slots matrix with free/busy cells.

## Test credentials (also `/app/memory/test_credentials.md`)
- Admin: admin@cricketacademy.com / Admin@12345
- Parent: user@cricketacademy.com / User@12345
- Coach: coach@cricketacademy.com / Coach@12345

## Verification
- Iteration 1 backend: 33/33 passing (initial run).
- Iteration 2 backend: 29/29 new tests passing.
- Browser flows verified: parent login → dashboard with charts; academy login → control room with charts; operations matrix with date picker.

## Backlog
### P1
- Real email service (Resend / SendGrid) and Twilio WhatsApp Business API.
- Coach self-dashboard: link `users.coach_id` → coach record so coaches see own sessions.
- Re-validate booking start_hour/duration in PUT (only validated on create).
- Notification on `/fees/{id}/mark-paid`.
- Migrate `@app.on_event` to FastAPI lifespan.
- Forgot/reset password flow + Profile page (edit name, phone, kids).

### P2
- Stripe payments for fees.
- Bowling-machine add-ons & equipment store.
- Photo galleries per coach + tournament results.
- League standings, team chat.
- Admin CSV export.
- Multi-academy (white-label) support.
