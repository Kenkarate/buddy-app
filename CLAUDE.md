# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Buddy is a mobile-first fitness web app: a React (Vite) SPA frontend in `client/` and an
Express + MongoDB (Mongoose) REST API in `server/`. Users buy individual workout/diet
**plans** (per-plan, not a single subscription), and an admin panel manages users, workouts,
diets, and support. Deployed to Netlify: the SPA is served statically and the entire Express
app runs as a single serverless function.

## Commands

Run frontend and backend in two separate terminals during development.

```bash
# Frontend (client/) — Vite dev server on :5173, proxies /api to :5001
cd client && npm run dev
cd client && npm run build      # production build to client/dist
cd client && npm run lint       # ESLint (flat config in eslint.config.js)

# Backend (server/) — nodemon on :5001 (PORT env overrides)
cd server && npm run dev
cd server && npm start          # node index.js (no reload)

# One-off scripts (run from server/)
node createAdmin.js                  # upsert admin@buddy.com / admin12345
npm run seed:exercises               # seed Exercise collection from free-exercise-db
npm run seed:exercise-gifs           # backfill exercise GIFs from exercisedb.dev (rate-limited, cached)
npm run seed:pricing                 # seed PricingPlan rows from current prices (idempotent)
```

There is no test suite. The root `package.json` `build` script is what Netlify runs
(installs both workspaces, builds the client).

## Architecture

### Backend (`server/`)
- **Entry `index.js`** wires every router under `/api/*` and exports `{ app, connectDB }`.
  `connectDB()` is idempotent (guards a module-level `isConnected` flag) so it can be safely
  called per-invocation in serverless. When run directly (`require.main === module`) it
  connects then `app.listen`s.
- **Serverless wrapper `netlify/functions/api.js`** wraps `app` with `serverless-http`,
  awaits `connectDB()` on each request, and sets `callbackWaitsForEmptyEventLoop = false`.
  Netlify redirects `/api/*` → this function; all other paths → `index.html` (SPA fallback).
- **Auth**: JWT bearer tokens, 30-day expiry, signed with `JWT_SECRET`. `middleware/authMiddleware.js`
  (`protect`) verifies the token and sets `req.user` (payload is `{ id }`). `middleware/adminMiddleware.js`
  (`adminOnly`) loads the user and checks `role === "admin"`; always chain it after `protect`.
  Google OAuth login is supported via `google-auth-library`.
- **Models** (`models/`) center on a large `User` document that embeds purchase history
  (`purchasedPlans[]`), weight/BMI history, and legacy assigned workouts/diet. Workout content
  is spread across several models (`Exercise`, `WorkoutPlan`, `DailyWorkoutSchedule`,
  `NormalWorkoutSchedule`, `WeeklyWorkoutPlan`, `WorkoutEvent`, etc.) — check which one a route
  uses before assuming.
- **Request body quirk**: serverless sometimes delivers the JSON body as a `Buffer`
  (`{ type: "Buffer", data: [...] }`). `index.js` applies the shared `parseBodyMiddleware`
  (`utils/parseBody.js`) globally to re-parse this; some older routes (e.g. `authRoutes.js`'s
  `parseRequestBody`) also re-parse defensively. Preserve this handling when touching parsing.

### Admin API conventions (`/api/admin/*`)
- **Response envelope** (admin routers only — `adminDashboardRoutes`, `adminRoutes`,
  `adminAssignmentRoutes`, `adminPricingRoutes`): success → `{ data, meta? }`, failure →
  `{ error: { message, code, details? } }`. Use `ok(res, data, meta)` and throw
  `new AppError(msg, status, code, details)` from `utils/apiResponse.js`. A central error handler
  in `index.js` (registered after all routes) formats thrown errors. Express 5 forwards async
  rejections, so admin handlers skip try/catch. User-facing routes keep their original raw shapes.
- **Frontend** calls admin endpoints via `client/src/api/adminApi.js` (wraps the `api` axios
  instance), which unwraps to `{ data, meta }` and normalizes errors to `err.message`/`err.code`.
  Non-admin endpoints still use `api` directly. `protect`/`adminOnly` 401/403s are NOT enveloped
  (shared middleware); `adminApi` falls back to the raw error for those.
- **Validation**: hand-rolled helpers in `utils/adminValidation.js` (`requireString`,
  `requireEnum`, `requireNumber`, `requireObjectId`) throw `AppError(422)`. No validation library.
- **Plan management**: `utils/planManagement.js` (`grantPlan`/`extendPlan`/`revokePlan`/
  `recordPayment`) is the single source of truth for writing a purchase. Both
  `paymentRoutes.js` verify and the admin `users/:id/grant-plan|extend-plan|revoke-plan`
  endpoints use it, so `purchasedPlans[]` + legacy fields stay in sync and every real purchase
  writes a `Payment` doc (the revenue source for analytics).

### Plans & payments (the core domain model)
- Plan keys: `personal-training`, `normal-workouts`, `home-workout`. Many aliases map to these
  (`pte`/`normal`/`normal-workout`/`home` …) — canonical prices and the alias→canonical mapping
  live in `server/routes/paymentRoutes.js` (`planPrices`) and `client/src/utils/planAccess.js`
  (`PLAN_DETAILS`, `normalizePlan`). Keep these two in sync when changing prices or plan keys.
- **Pricing is INR-first**: prices are admin-editable in the `PricingPlan` collection
  (`baseAmount` in INR rupees; edit via `/admin/settings` → `/api/admin/pricing`). `paymentRoutes.js`
  reads these (×100 → paise) and falls back to the hardcoded `planPrices` map for any plan not in
  the DB. `server/utils/geoLocation.js` detects the client's country (via IP), `server/utils/currency.js`
  picks the currency and converts INR paise using live rates (open.er-api.com, 6h cache, static fallback).
- Payments go through Razorpay (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`); signatures are HMAC-verified.
  `DummyRazorpay.jsx` is the checkout page (handles both one-time orders and subscriptions).
- **`personal-training` is a one-time order** (`create-order`/`verify`). **`normal-workouts` and
  `home-workout` are auto-renewing monthly Razorpay Subscriptions** (`SUBSCRIPTION_PROGRAMS` in
  `paymentRoutes.js`, mirrored by `SUBSCRIPTION_PLANS` in `client/src/utils/planAccess.js`):
  - `POST /payments/subscribe/:program` creates the subscription (lazily creating + caching a
    Razorpay Plan on the `PricingPlan.razorpayPlanId`; subscriptions are billed in **INR only** —
    plan amounts are fixed, so per-country currency conversion does not apply to them).
  - `POST /payments/subscription/verify` HMAC-verifies `payment_id|subscription_id` and grants the
    first cycle for instant UX. `POST /payments/subscription/cancel` cancels at cycle end.
  - **`POST /api/payments/webhook`** (mounted with `express.raw` BEFORE the JSON parser in
    `index.js`, verified with `RAZORPAY_WEBHOOK_SECRET`) is the source of truth for renewals +
    revenue: `subscription.charged` re-grants a cycle via `grantPlan` (resets the home-workout
    30-day unlock window) and records a `Payment`; `cancelled`/`halted` update status / revoke.
  - User subscription lifecycle is tracked in `User.subscriptions[]`; access still comes from
    `purchasedPlans[]`. All access writes funnel through `utils/planManagement.js`.
- Access is **per-plan and time-bounded**: a user has access if `purchasedPlans[]` contains the
  plan with `paymentStatus: "paid"` and an unexpired `planExpiryDate` (legacy fallback:
  `selectedProgram === plan && subscriptionStatus === "paid"`).
- **Home workout** content is a 30-day numbered program (`HomeWorkoutDay` model, admin CRUD at
  `/api/admin/home-workout-day(s)`, built in `/admin/home-workout`). The user page
  (`HomeWorkoutCalendar`) unlocks Day N at `purchaseDate + (N-1)·24h`, locking everything once the
  plan expires; `GET /api/home-workout/plan` returns the days + the user's start/expiry window.

### Frontend (`client/`)
- **Routing** is all in `src/App.jsx` (React Router v7), pages are lazy-loaded. Three guards:
  - `ProtectedRoute` — requires a `buddyToken` in localStorage.
  - `PlanRoute plan="…"` / `anyPlans={[…]}` — verifies plan access by calling the API
    (`/payments/access/:plan` or `/auth/profile`), redirects unpaid users to `/payment/:plan`.
  - `AdminRoute` — requires token **and** `buddyUser.role === "admin"` (client-side check only;
    the API still enforces `adminOnly`).
- **API client `src/api/api.js`**: a single axios instance with `baseURL: "/api"` that injects
  `Authorization: Bearer <buddyToken>` from localStorage. Use this for all backend calls.
- **Auth/session state lives in localStorage**, not context: `buddyToken`, `buddyUser` (JSON),
  `buddyTheme`, `buddyPendingProgram`. Theme is applied via `data-theme` on `<html>` (default `dark`).
- **UI**: Tailwind v4 (via `@tailwindcss/vite`) + shadcn-style primitives in `src/components/ui/`.
  Use the `cn()` helper from `src/lib/utils.js` for class merging. The `@` alias points to `src/`.
  User-facing pages render inside `UserLayout` (mobile shell with top bar + `FooterNav`); admin
  pages use `AdminShell`/`AdminLayout`, both of which navigate via the shared top-left hamburger
  `AdminNavMenu` (single source of admin nav items; replaced the old fixed footer nav).

## Environment

`server/.env` (gitignored) provides: `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (for subscription renewals),
`CLIENT_URL`/`FRONTEND_URL`, `PORT`. In production these
are set as Netlify environment variables.
