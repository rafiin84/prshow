# PR Show — Beyond the Screen

The official fan community web app for Pradeep Ranganathan ("PR"): a fan experience (movies, games, reels, events, welfare, rewards, membership) and a geographically scoped admin workspace (moderation, members, appointments, events, messages, AI-assisted tools) in one responsive Next.js app.

> **This is a frontend-only demo.** Everything runs against typed, in-browser mock services. There is no backend, database, auth provider, SMS/OTP, Aadhaar/identity service, biometrics, payments, push, or AI API. See [Mock-only capabilities](#mock-only-capabilities).

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # strict TypeScript
npm run lint
npm test             # vitest: permissions, workflow, validation, end-to-end service journeys
npm run build && npm start
```

Node 20+ recommended. An `.npmrc` sets `legacy-peer-deps=true` (an optional peer of `@hookform/resolvers` otherwise blocks install).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Framer Motion · Phosphor Icons · Zustand · TanStack Query · React Hook Form + Zod · Vitest.

Notes on deviations from the brief:
- **shadcn/ui**: the primitives in `src/components/ui` are hand-written, shadcn-*style* components (cva variants, native `<dialog>` for focus trapping, animated tabs). The shadcn CLI/Radix wasn't used, to keep the build network-free.
- **Fonts**: a deliberate system stack (editorial serif display + system sans) instead of remote `next/font`, so nothing needs the network.
- **i18n**: UI chrome, navigation and access messages go through a message catalogue (`src/lib/i18n`, with a partial Tamil example). Feature-level copy is still inline English; moving it into the catalogue is mechanical but not done.
- **PWA**: manifest and icon are included; there is no service worker.

## Try the demo

Open `/welcome`.

| Goal | How |
| --- | --- |
| Explore as a fan | **Continue as demo fan** (Meera, approved member, Chennai · Mylapore · Ward 12) |
| Full onboarding | **Join PR Show** → OTP is always `123456` → location (State → District → AC → Ward) → two simulated checks → *Pending review* |
| Approve that application | Header **Demo** button → switch to Ward / AC / District / **Central** Admin covering your chosen area → *Members* → open the applicant → *Approve*. Switch back to see the card. |
| Switch roles | **Demo** → role switcher (Fan, Central, District, AC, Ward). Nav, scope, permissions and data all follow. |
| See escalation | Ward Admin → *Moderation* → open "Mandaveli fan club banner timelapse" (1 h window). **Demo → +1 hour** and reload: it escalates to District; **+2 hours** more: Central. Viewing doesn't stop the timer; a decision does. |
| See errors and retry | **Demo → Fail every request** (or *Fail next request*), then use *Try again*. |
| Start over | **Demo → Reset all demo data**. |

The Demo menu is clearly labelled evaluation tooling. Role switching is a **simulation, not a security control**.

## Routes

**Public:** `/welcome` · `/join` · `/join/otp` · `/join/location` · `/join/verify` · `/join/status` · `/signin` · `/signin/otp`

**Shared:** `/profile` (role-aware) · `/notifications` · `/help`

**Fan** (bottom nav: Home · Games · **PR** · Reels · Events):
`/` · `/games` · `/games/mode/[mode]` · `/games/challenge/[quizId]` · `/games/play/[quizId]` · `/games/result/[attemptId]` · `/games/leaderboard` · `/games/history` ·
`/pr` · `/pr/movies` · `/pr/movies/[id]` · `/pr/gallery` · `/pr/gallery/[id]` ·
`/reels` · `/reels/[id]` · `/reels/submit/[new|reelId]` ·
`/events` · `/events/[id]` · `/events/mine` · `/events/pass/[eventId]` · `/events/welfare` · `/events/welfare/[id]` ·
`/profile/membership` · `/profile/rewards` · `/profile/submissions` · `/profile/history` · `/profile/saved` · `/profile/settings`

**Admin** (bottom nav: Home · Messages · **PR** · Events · Reels; tools in the sidebar *Workspace* group, or the header menu on small screens):
`/admin` · `/admin/messages` · `/admin/messages/[id]` · `/admin/pr` · `/admin/events` · `/admin/events/[id]` · `/admin/reels` ·
`/admin/moderation` · `/admin/moderation/[id]` · `/admin/guardian` · `/admin/members` · `/admin/members/[id]` · `/admin/appointments` · `/admin/quiz-studio` · `/admin/announcements` · `/admin/notifications` · `/admin/rewards` · `/admin/activity`

Fans visiting `/admin/*` see an access-denied state; admins visiting fan-only routes are redirected to `/admin`.

## Architecture

```
src/
  app/                 routes: (public) onboarding, (app) fan + /admin shells
  components/          ui primitives, layout/shell, feedback (empty/error/skeleton), media, data-display
  features/            feature components (games, reels, events, admin, membership, …)
  lib/
    api/               mock services: db.ts (single source of truth + demo clock), fan.ts, admin.ts, client.ts
    permissions/       policy.ts — ALL role/scope checks live here
    moderation/        workflow.ts (escalation + transitions), guardian.ts (mock AI)
    rewards/ quiz-generator.ts validation/ i18n/ theme/ query/
  data/seeds/          deterministic seed data (Tamil Nadu hierarchy, people, content, ops)
  stores/              zustand: session, demo tooling, toasts
  tests/               vitest
```

Key decisions:
- **One source of truth.** Every list, badge, dashboard metric and detail view reads the same in-memory DB through the mock services; mutations invalidate TanStack Query so everything stays consistent. Demo state is persisted to `localStorage` (non-sensitive only) and restored on refresh.
- **Demo clock.** Core behaviour never reads the real clock. Time starts at 19 Oct 2026 10:00 IST and moves only via the Demo menu. Escalations are materialised from that clock (`applyEscalations`).
- **Policies, not role strings.** Components call `canDecideCase`, `canNominate`, etc. and render the returned `reason` when an action is unavailable.
- **Mock API realism.** Deterministic latency, configurable failures, validation errors, and conflict/forbidden responses.

## What's implemented

- **Onboarding / membership:** sign-up + OTP simulation, dependent location pickers, simulated Secure-QR and liveness steps (no camera, no identity data), status states, manual approval, membership card with an opaque-token mock QR.
- **Fan:** Home, PR movie catalogue + detail, official gallery with lightbox, Reels (snap-scroll on mobile, focused player + keyboard shortcuts on desktop, simulated playback, like/save/share/report, submit flow with simulated upload), Games (trivia, dialogue, scene, song, daily, welcome quiz; keyboard play; individual leaderboard only), Events (filters, RSVP / waitlist / cancel, pass), Welfare, Profile, Rewards (badges, wallpapers, simulated passes/tickets), Saved, Settings, Notifications.
- **Admin:** role-aware Home (every metric derives from the same selectors as its queue, with a definition tooltip), moderation queue + detail with Ward 1 h → District 2 h → Central escalation, AI Content Guardian (mock), members + verification decisions, appointments (Central appoints District; District nominates AC; AC nominates Ward; Central gives final approval; pending nominees are inactive), admin-only messages with failed-send retry, announcements, PR content (movies / albums / rights metadata / reorder), reels, events + attendees + simulated QR check-in + welfare, Quiz Studio (mock AI generation, editing, validation, preview, explicit publish approval), rewards administration with audit, notification broadcast, activity log.

## Mock-only capabilities

OTP/SMS, identity verification, secure QR, liveness/selfie, face/biometrics, AI Content Guardian, AI Quiz Studio, uploads (the file is never read), video playback (a scripted demo player; no audio), QR codes (decorative; carry an opaque token and are not scannable), push notifications, rewards (wallpapers are demo art; passes/tickets are explicitly simulated and not redeemable).

## Content honesty

All artwork is generated placeholder art and is labelled "Demo art". Movie titles and years are limited to widely known facts; synopses, cast/crew, quizzes (especially the dialogue/scene/song ones) and welfare activities are **demo copy** flagged for replacement with approved material. Nothing claims official announcements, real attendance, donations or impact.

## Testing

`npm test` runs 50 tests covering geographic scope and role policies, escalation timing and transitions, form validation, quiz generation/validation, and service-level journeys (reel privacy → approval → feed, quiz points/badges, daily reset, RSVP waitlist + promotion, verification approval, nominations and inactive nominees, Guardian never changing status, scoped messages, dashboard/queue consistency, simulated failures, reset).

Browser verification during development covered every route at 360/390/768/1024/1280/1440px (no horizontal overflow, no console errors) plus scripted end-to-end journeys in Chromium. Those scripts aren't part of the repo.
