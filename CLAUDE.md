# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Buddy is a mobile-first fitness web app, built as a **single unified Next.js 16 App Router
app (TypeScript)**. Pages and the REST API live in the same project: UI in `app/` route
groups + `components/`, and the API as Route Handlers under `app/api/*`, all backed by
MongoDB (Mongoose). Users buy individual workout/diet **plans** (per-plan, not a single
subscription), and an admin panel manages users, workouts, diets, and support. Deployed to
Netlify via `@netlify/plugin-nextjs`.

> History: this was migrated from a Vite React SPA (`client/`) + standalone Express API
> (`server/`). Those directories are gone — everything is one Next.js app now.

## Commands

```bash
npm run dev          # next dev (http://localhost:3000)
npm run build        # next build
npm run start        # next start (after build)
npm run lint         # eslint (flat config in eslint.config.mjs)
npm run typecheck    # tsc --noEmit

# One-off scripts (TS, run via tsx with --env-file=.env.local; see package.json)
npm run create-admin       # upsert admin@buddy.com / admin12345
npm run seed:exercises     # seed Exercise collection from free-exercise-db
npm run seed:exercise-gifs # backfill exercise GIFs from exercisedb.dev (rate-limited, cached)
npm run seed:pricing       # seed PricingPlan rows (idempotent)
```

There is no test suite. `next build` is what Netlify runs.

## Architecture

### App Router layout (`app/`)
- **Route groups**: `app/(shell)/*` are user-facing pages wrapped in `UserLayout` (mobile
  shell: top bar + `FooterNav`). `app/(admin)/*` are admin pages; `app/(admin)/layout.tsx`
  enforces the admin role server-side. Standalone routes (`/login`, `/register`,
  `/payment/[program]`, `/razorpay/[program]`, `/coming-soon`, root `/`, `not-found`) sit
  directly under `app/`.
- **Pages render client-only**: each page route default-exports `dynamic(() => import(...),
  { ssr: false })` (the page components in `components/pages/*` are `"use client"` and read
  `localStorage` during render, carried over from the original SPA). Plan-gated routes are a
  server `page.jsx` that runs a guard then renders a small client wrapper (`Client.jsx`).
- **React Router shim**: `lib/navigation.tsx` re-implements `useNavigate`, `useLocation`,
  `useParams`, `Link`, `NavLink` on top of `next/navigation`, so ported pages keep their
  original call sites. Ported pages/components are `.jsx` (allowJs); new infra is `.ts(x)`.

### Auth (cookie-based)
- JWT (30-day, `JWT_SECRET`) is stored in an **httpOnly `buddyToken` cookie**, set by the
  login/register/google route handlers and cleared by `/api/auth/logout`. `lib/auth.ts` is
  the single source: `signToken`, `setAuthCookie`/`clearAuthCookie`, `getCurrentUser()` (for
  Server Components), and route-handler guards `requireAuthId` / `requireUser` /
  `requireAdmin` (cookie first, then a legacy `Authorization: Bearer` header for transition).
- **`proxy.ts`** (Next 16 proxy convention, the renamed `middleware.ts`) runs on the Edge,
  verifies the cookie with `jose`, and redirects unauthenticated users off protected/admin
  path prefixes to `/login` / `/admin-login`. It only checks authentication; the admin role
  and plan access (DB lookups) are enforced in Server Components.
- `lib/guards.ts` provides Server-Component page guards `requireAuth` / `requireAdmin` /
  `requirePlan(plans, paymentPlan)` (replacing the old client `ProtectedRoute`/`PlanRoute`/
  `AdminRoute`). The client axios instance (`lib/api.ts`) relies on the same-origin cookie.

### API route handlers (`app/api/*`)
- One folder per resource; Express path params became folder segments (`:id` → `[id]`).
  Use `await req.json()` (helper `lib/http.ts` `readJson`) — no Buffer re-parsing is needed
  (that serverless quirk is gone). DB access calls `await connectDB()` first.
- **`lib/db.ts`** caches the Mongoose connection on `globalThis` (replaces the old
  `isConnected` flag). Models in `models/*.ts` export a re-registration-guarded model
  (`mongoose.models.X || mongoose.model(...)`) as a **named** export plus a default alias —
  import the **named** export (`import { User } from "@/models/User"`); the function-valued
  default breaks under tsx's interop in seed scripts. When a query uses `.populate()` across
  refs, side-effect import the referenced model so it's registered.

### Admin API conventions (`/api/admin/*`, `/api/admin-assignments/*`)
- **Response envelope**: success → `{ data, meta? }`, failure → `{ error: { message, code,
  details? } }`. Use `ok(data, meta)` and throw `AppError(msg, status, code, details)` from
  `lib/apiResponse.ts`. Wrap each admin handler in `withErrorHandler(...)` — there is no
  global Express-style error middleware in Next, so this wrapper produces the error envelope.
  User-facing routes keep their original raw shapes (`{ message }`, model JSON).
- **Frontend** calls admin endpoints via `lib/adminApi.ts` (wraps `lib/api.ts`), which
  unwraps to `{ data, meta }` and normalizes errors to `err.message`/`err.code`.
- **Validation**: hand-rolled helpers in `lib/adminValidation.ts` (`requireString`,
  `requireEnum`, `requireNumber`, `requireObjectId`) throw `AppError(422)`.
- **Plan management**: `lib/planManagement.ts` (`grantPlan`/`extendPlan`/`revokePlan`/
  `recordPayment`/`upsertSubscription`) is the single source of truth for writing a purchase
  — used by both `/api/payments/verify` and the admin grant/extend/revoke endpoints, so
  `purchasedPlans[]` + legacy fields stay in sync and every real purchase writes a `Payment`.

### Plans & payments (the core domain model)
- Plan keys: `personal-training`, `normal-workouts`, `home-workout`. Aliases map to these;
  canonical prices + alias→canonical mapping live in `lib/payments.ts` (`planPrices`) and
  `lib/planAccess.ts` (`PLAN_DETAILS`, `normalizePlan`) — keep these in sync.
- **Pricing is INR-first**: admin-editable in the `PricingPlan` collection (`baseAmount` in
  INR rupees; edit via `/admin/settings` → `/api/admin/pricing`). `lib/payments.ts` reads
  these (×100 → paise), falling back to the hardcoded `planPrices`. `lib/geoLocation.ts`
  detects the client country; `lib/currency.ts` picks currency + converts INR paise via live
  rates (6h cache, static fallback). `lib/currencyClient.ts` is the browser-side helper.
- Payments go through Razorpay (`RAZORPAY_KEY_ID`/`SECRET`); signatures are HMAC-verified.
  `personal-training` is a **one-time order** (`/api/payments/create-order` + `/verify`).
  `normal-workouts` and `home-workout` are **auto-renewing monthly Razorpay Subscriptions**
  (`/api/payments/subscribe/[program]`, `/subscription/verify`, `/subscription/cancel`;
  `SUBSCRIPTION_PROGRAMS` in `lib/payments.ts` mirrors `SUBSCRIPTION_PLANS` in
  `lib/planAccess.ts`). Subscriptions are billed in **INR only**.
- **`app/api/payments/webhook/route.ts`** (`runtime = "nodejs"`) is the source of truth for
  renewals + revenue: it reads `await req.text()` for HMAC over the exact raw bytes (verified
  with `RAZORPAY_WEBHOOK_SECRET`), and `subscription.charged` re-grants a cycle via
  `grantPlan` (resetting the home-workout 30-day window) + records a `Payment`;
  `cancelled`/`halted` update status / revoke.
- Access is **per-plan and time-bounded**: `hasActivePurchase(user, plan)` (`lib/payments.ts`)
  checks `purchasedPlans[]` for the plan with `paymentStatus: "paid"` and an unexpired
  `planExpiryDate` (legacy fallback: `selectedProgram`/`subscriptionStatus`).
- **Home workout** is a 30-day numbered program (`HomeWorkoutDay`, admin CRUD at
  `/api/admin/home-workout-day(s)`). `GET /api/home-workout/plan` returns the days + the
  user's start/expiry window; the client unlocks Day N at `purchaseDate + (N-1)·24h`.

### Frontend specifics
- **UI**: Tailwind v4 (via `@tailwindcss/postcss`) + shadcn-style primitives in
  `components/ui/*`. All app CSS is consolidated into `app/globals.css`. Use `cn()` from
  `lib/utils.ts`. The `@` alias points to the repo root.
- **Session state in localStorage** (client UI only — real auth is the cookie): `buddyUser`
  (JSON), `buddyTheme`, `buddyPendingProgram`. Theme is applied via `data-theme` on `<html>`
  (anti-flash script in `app/layout.tsx`; default `dark`).
- Google OAuth via `@react-oauth/google` (`Providers` in `app/providers.tsx`). Razorpay
  checkout script is loaded in the root layout.

## Environment

`.env.local` (gitignored) provides: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `UPLOADTHING_TOKEN`,
`CLIENT_URL`/`FRONTEND_URL`, and the client-exposed `NEXT_PUBLIC_GOOGLE_CLIENT_ID` /
`NEXT_PUBLIC_RAZORPAY_KEY_ID`. In production these are Netlify environment variables.
