# Clinic Booking System — Frontend

The frontend of the Clinic Booking System ("MediCare"). It is the client-side application that lets patients browse doctors, book and manage appointments, record payments, and leave reviews; lets doctors manage their schedules and appointments; and gives administrators full CRUD over users, patients, doctors, clinics, specialties, schedules, slots, appointments, payments, and reviews.

It talks to the backend REST API documented in the [backend README](../README.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 (`tw-animate-css`, `tailwind-merge`, `class-variance-authority`) |
| **UI Components** | shadcn-style components on [Base UI React](https://base-ui.com), `lucide-react` icons |
| **Data Fetching** | TanStack Query 5 (+ devtools) |
| **HTTP Client** | Axios (with auth/refresh interceptors) |
| **Forms** | React Hook Form + `@hookform/resolvers` |
| **Validation** | Zod 4 |
| **Dates** | `date-fns`, `react-day-picker`, `cmdk` |
| **Development/Tooling** | ESLint, Vitest (configured in devDependencies), Playwright (devDependency), npm |

---

## Architecture

The application is a **single-page Next.js App Router project** that is **mostly client-side rendered**: the auth state, guards, data fetching, and data tables all live behind `"use client"` components. Pages are grouped into three route groups so they can share layouts and guards.

### Route Groups

```
src/app/
├── layout.tsx                    # Root layout — fonts, ThemeProvider, Providers, Toaster
├── providers.tsx                 # Composes Theme > Query > Auth providers
├── (public)/                     # Landing, login, register — PublicGuard redirects authed users
├── (authenticated)/              # Patient & doctor areas — AuthGuard (redirects to /login)
└── (admin)/                      # Admin area — AuthGuard + AdminGuard (admin role only)
    ├── layout.tsx                # AdminLayout (sidebar + navbar)
    ├── loading.tsx / error.tsx
    └── admin/*/page.tsx          # One page per resource
```

### Providers (`src/providers/`)

- `auth-provider.tsx` — React context exposing `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`, `updateUser`. On boot it restores the session by refreshing the tokens and fetching the current user via `/auth/me`.
- `query-provider.tsx` — TanStack Query `QueryClientProvider` with devtools.
- `theme-provider.tsx` — Theme (light/dark) state for the app.

### Client / Server Boundaries

- Root layout and landing page are server components (`src/app/(public)/page.tsx` exports `metadata`).
- Everything interactive (guards, forms, tables, booking flow) is a client component.
- There is **no Next.js `middleware.ts`** — route protection is done client-side by guard components.

### Feature-First Directory Layout

`src/features/<domain>/` contains the per-feature API client, TanStack Query hooks, and (where relevant) schemas; cross-cutting concerns live in shared folders:

```
src/
├── app/            # Route groups + pages + layouts
├── components/
│   ├── ui/         # shadcn-style primitives (button, dialog, table, form, …)
│   ├── layout/     # AppLayout, Navbar, AdminLayout/Sidebar/Navbar, Footer, …
│   ├── guards/     # auth-guard, admin-guard, public-guard
│   ├── business/   # Domain components (DoctorCard, SlotPicker, StepWizard, …)
│   ├── data/       # DataTable, Pagination, SearchInput, FilterDropdown
│   ├── dashboard/  # DashboardHero, QuickActions, UpcomingAppointments, …
│   └── feedback/   # EmptyState, ErrorBanner, Skeleton, toast/toaster
├── features/       # One folder per domain (auth, doctors, appointments, …)
│   ├── api/        # Typed API functions
│   ├── hooks/      # TanStack Query hooks (queries + mutations)
│   └── index.ts
├── hooks/          # Shared hooks (useApiError, useDebounce, usePagination, …)
├── lib/            # axios client, query-client, query-keys, token-store, routing, utils
├── providers/
├── schemas/        # Zod schemas mirrored per feature
├── config/         # API base URL, stale-time, pagination defaults
└── types/          # API + domain/model types
```

---

## Routes

| Route | Group | Access |
|-------|-------|--------|
| `/` | public | Landing page (HeroSection) |
| `/login` | public | Register/login — redirects authenticated users |
| `/register` | public | |
| `/dashboard` | authenticated | Role-aware dashboard (patients & doctors) |
| `/book` | authenticated | Booking wizard (browse doctors → pick slot → confirm) |
| `/appointments` | authenticated | Appointment list (patients & doctors) |
| `/appointments/[id]` | authenticated | Appointment detail |
| `/payments` | authenticated | My payments (patients) |
| `/reviews` | authenticated | My reviews (patients) |
| `/profile` | authenticated | Profile view/edit + avatar upload |
| `/schedule` | authenticated | Doctor weekly schedule management (doctor role) |
| `/admin/dashboard` | admin | Admin overview |
| `/admin/users` | admin | Admin CRUD tables for users, patients, doctors, clinics, specialties, doctor-schedules, appointment-slots, appointments, payments, reviews |

Legend: `public` = no auth, `authenticated` = any logged-in user (patient or doctor), `admin` = `admin` role.

---

## Authentication

- **Access token**: kept **in memory only** (`token-store.ts`), attached to requests by the Axios request interceptor as `Authorization: Bearer <token>`. It is never written to storage.
- **Refresh token**: stored in **`localStorage`** under the `hf_refresh_token` key so the session can be restored after a page reload.
- **Login/register**: call `/auth/login` / `/auth/register`, store both tokens, then fetch the user via `/auth/me`.
- **Refresh flow**: on a `401` that is not an auth endpoint and not already retried, the Axios response interceptor calls `/auth/refresh` with the stored refresh token (a shared promise prevents concurrent refreshes), updates both tokens, and replays the original request. If refresh fails, tokens are cleared, a toast is shown, and the user is redirected to `/login`.
- **Logout**: calls `/auth/logout` with the refresh token, clears both tokens and the `user` state, and toasts.
- **Auth provider boot**: if a refresh token exists on load, the app refreshes/then fetches the current user before rendering guarded pages.
- **Route protection**: `auth-guard` redirects unauthenticated users to `/login?redirect=…`; `admin-guard` requires role `admin`; `public-guard` redirects already-authenticated users to their role home page. All guards are client-side (no `middleware.ts`).
- **Role home**: `/dashboard` for patient/doctor, `/admin/dashboard` for admin.

---

## API Integration

- Client: `src/lib/axios.ts` — a single Axios instance.
- Base URL: `NEXT_PUBLIC_API_URL`, defaulting to `/api/v1` when unset (see Environment Variables).
- Request interceptor: adds the in-memory access token.
- Response interceptor: handles 401 → silent refresh + retry (see Authentication).
- Endpoint functions are organized per feature in `src/features/<domain>/api/*.ts`.
- Data fetching is orchestrated with TanStack Query in `src/features/<domain>/hooks/*`, using shared query keys (`src/lib/query-keys.ts`) and configurable stale times (`src/config/index.ts`).
- Errors from mutations are normalized via `useApiError` (from `ApiResponse.error` / `errors` payloads) and surfaced with `use-toast`.
- Pagination is handled client-side through `usePagination` + the `Pagination` component.

---

## UI / Design System

- Tailwind CSS 4, configured through CSS (`globals.css`) with design tokens exposed as CSS variables (background, surface, on-surface/primary, etc.).
- Icon set: `lucide-react`.
- Reusable primitives in `src/components/ui/`: `button`, `avatar`, `badge`, `card`, `dialog`, `dropdown-menu`, `input`, `input-group`, `label`, `popover`, `select` (Base UI), `sheet`, `separator`, `table`, `tabs`, `textarea`, `tooltip`, `command`, `calendar`.
- Shared building blocks in `src/components/`: layout (navbar/sidebar/admin chrome), guards, data (`DataTable`, `Pagination`, `SearchInput`, `FilterDropdown`), feedback (`EmptyState`, `ErrorBanner`, `Skeleton`, `toast`/`toaster`), and dashboard cards.
- Domain components in `src/components/business/`: `DoctorCard`, `SlotPicker`, `StepWizard`, `TimeBlock`, `WeeklyCalendar`, `StatusBadge`, `StarRating`, form modals (`DoctorFormModal`, `PatientFormModal`, `ClinicFormModal`, `SpecialtyFormModal`, `ScheduleFormModal`, `SlotFormModal`, `UserFormModal`, `PaymentFormModal`), etc.

---

## Main User Flows

- **Authentication** — Register / login / logout with persistent sessions via refresh-token rotation and role-aware redirects.
- **Patient dashboard** — Next-appointment hero, quick actions, upcoming appointments, health profile.
- **Doctor browsing & booking** — `/book` multi-step wizard: pick a doctor (with search/filter), see availability, select a slot, confirm; `AppointmentConfirmation` collects the result and can offer payment.
- **Appointment management** — List, detail modal, and cancellation from patient and doctor sides.
- **Doctor schedule management** — `/schedule` weekly calendar for creating/updating/deleting recurring schedule blocks.
- **Admin dashboard** — Overview page plus per-resource management tables with create/edit/delete modals, search, filters, and pagination.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (the frontend appends paths like `/auth/login`) | `/api/v1` |

Example (see `frontend/.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Only public variables (`NEXT_PUBLIC_*`) are exposed to the browser. No secrets are required by the frontend.

---

## Local Development

From inside the `frontend/` directory:

```bash
npm install
npm run dev            # next dev -p 3000
```

- The app runs at `http://localhost:3000`.
- The backend defaults to `http://localhost:3001` in its own `.env.example`; if yours differs (e.g. `8000`), set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- The root `.env.example` sets `CORS_ORIGINS=http://localhost:3000` so the API accepts the dev frontend.

## Lint / Quality

```bash
npm run lint           # eslint
```

Vitest and Playwright are present in `devDependencies`, but no test files or configuration files are committed yet, so there are currently no runnable frontend tests.

---

## Production Build

```bash
npm run build          # NODE_ENV=production next build
npm run start          # next start
```

## Deployment

The frontend is deployed on **Vercel** at `https://clinic-booking-system-two.vercel.app/`. In the Vercel project set `NEXT_PUBLIC_API_URL` to the deployed backend base URL (the same variable used locally). If the backend and frontend share an origin, the default `/api/v1` also works through a rewrite/proxy configured on the platform.

Backend API documentation: [`../README.md`](../README.md).
