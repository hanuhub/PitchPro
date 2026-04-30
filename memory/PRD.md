# Cricket Academy App — PRD

## Original Problem Statement
Cricket Academy App with: browser-based + mobile-friendly UI, free DB & hosting, admin module, individual user accounts (email/password), no payment integration yet. Optional WhatsApp messages for announcements. Modules:
1. Cricket Lane Scheduling (book lanes, email confirmation, modify up to 24h before)
2. About Academy (about us, coach profiles, awards — dummy data)
3. 1-1 Coaching Sessions (coach availability)
4. Kids Progress (weekly/monthly reports → email + in-app)
5. Weekly games (Sat/Sun) — team & ground location with GPS via email/WhatsApp.

## User Choices (defaults agreed)
- Auth: JWT email/password (admin/coach/user roles).
- Email & WhatsApp: **MOCKED** for MVP — messages persisted in DB and shown in user inbox.
- Maps: Google Maps URL (address + GPS).
- Hosting: Emergent deployment + MongoDB (free tier).

## Architecture
- Backend: FastAPI (single `server.py`) + Motor (async MongoDB) + JWT cookies + bcrypt.
- Frontend: React 19 + React Router 7 + Tailwind + Shadcn UI + Recharts + Sonner toasts.
- Theme: "Performance Pro" dark — Barlow Condensed + DM Sans, Leather-Red & Pitch-Green palette.

## User Personas
- **User (parent/player)**: books lanes, schedules 1-1 coaching, views kids' progress reports, sees weekly games.
- **Coach**: views students, sends progress reports, creates games, sends announcements.
- **Admin**: super privileges — manages lanes, coaches, users, all bookings, progress, games, announcements.

## Implemented (Apr 2026)
### Backend (`/app/backend/server.py`)
- Auth: register / login / me / logout / refresh, brute-force lockout (5 fails / 15 min), bcrypt, httpOnly cookies.
- Lanes: list/create/delete, availability per date.
- Bookings: create with conflict & 24h modify rule, list-mine, list-all (admin), update, cancel.
- Coaches: list/create/delete with awards & specialties; availability per date.
- 1-1 Sessions: create with day & hour validation, conflict check, list-mine, cancel.
- Kids Progress: admin/coach create reports (4 scores + summary), notification fired; users view via /progress/me.
- Games: list/create/delete; `/notify` mocks email + WhatsApp + in-app for all users.
- Announcements: send to all/users/coaches/single via email|whatsapp|in-app (mocked).
- Notifications: list-mine, mark-read.
- Awards: dummy seed of 4 academy honours.
- Admin: stats + users list.
- Seed on startup: admin, sample user (with 2 kids), sample coach, 5 lanes, 3 coaches, 4 awards, 2 weekend games (next Sat & Sun).

### Frontend pages (under `/app/frontend/src/pages`)
- Landing: hero with stadium bg, marquee, feature bento grid, CTA strip.
- Login / Register
- About Academy + Awards
- Coaches grid with profiles
- Games (public schedule)
- Dashboard (user): KPIs, schedule, progress charts (Recharts), games, inbox.
- BookLane: lane select + Shadcn calendar + slot chips + 24h policy.
- Coaching: 1-1 scheduler with coach availability calendar.
- Admin: 7-tab Control Room — Lanes, Coaches, Users, Bookings, Progress, Games (+notify), Announcements.

### Test credentials
- Admin: admin@cricketacademy.com / Admin@12345
- User:  user@cricketacademy.com / User@12345
- Coach: coach@cricketacademy.com / Coach@12345

## Verification
- 33/33 backend pytest cases passed (auth, lanes, bookings, sessions, progress, games, announcements, notifications, RBAC).
- Browser flow verified: cookie auth + landing + admin dashboard rendering correctly.

## Backlog (deferred)
### P1 (next iterations)
- Real email service (Resend / SendGrid) for booking & progress emails.
- Real WhatsApp Business API (Twilio) for game notifications.
- Coach self-dashboard (link `users.coach_id` → coach record so coaches see own sessions).
- Re-validate booking start_hour/duration in PUT (currently only validated on create).
- Migrate `@app.on_event` to FastAPI lifespan.
- Forgot/reset password flow.
- Profile page (edit name, phone, kids).

### P2
- Payment integration (Stripe).
- Bowling-machine add-ons.
- Photo galleries per coach + tournament results.
- League standings, team chat.
- Admin CSV export of bookings & reports.
- Multi-academy support.
