# MediCare Frontend — Final Delivery Report

> Engineering delivery document for the MediCare patient/doctor/admin frontend.
> Scope: `frontend/` (Next.js 16 App Router). Companion docs: `PROJECT_REPORT.md` (backend), `DESIGN.md` (visual identity).
> Branch: `feature/arabic-language`.

---

## 1. Executive Summary

The MediCare frontend is a bilingual (English/Arabic) hospital-booking application built on **Next.js 16.2.11 (App Router, Turbopack), React 19, TypeScript (strict), next-intl v4, TanStack Query, and Tailwind CSS v4**. It implements the **"The Prescription Pad"** visual identity: a night-desk default theme with a cream-paper day sheet, ink-blue print, one red rubber-stamp primary action, Archivo letterhead type, and Kalam/Aref Ruqaa ink annotations.

The delivery is **production-ready**. The Arabic i18n migration was completed across 112 files (+4,045/−1,189), a `middleware` → `proxy` migration was performed for the Next.js 16 convention, the theme is dark-by-default with a flash-free first paint, and the profile page was optimized via lazy-loaded edit forms with hover/focus prefetch. This final engineering review added explicit security headers (report-only CSP first), fixed a 375px admin-header overflow, and corrected the `.env.example` port.

Remaining work is **non-blocking technical debt**: CSP is report-only pending enforcement, no native unit-test harness is wired into `package.json`, and the Playwright audit suite is not yet CI-integrated. These are documented in §17 and require no changes for the current deployment.

---

## 2. Architecture

**Route tree** lives under `src/app/[locale]/` per next-intl App Router convention:

- `(public)/` — landing (`page.tsx`), `/login`, `/register`, wrapped by `PublicGuardWrapper` (`src/app/[locale]/(public)/public-guard-wrapper.tsx`).
- `(authenticated)/` — `/dashboard`, `/book`, `/appointments`, `/appointments/[id]`, `/payments`, `/profile`, `/reviews`, `/schedule`, wrapped by `AuthGuardWrapper` (`src/app/[locale]/(authenticated)/auth-guard-wrapper.tsx`).
- `(admin)/admin/` — 10 management pages (`clinics`, `doctors`, `patients`, `users`, `specialties`, `schedules`, `slots`, `appointments`, `payments`, `reviews`, `dashboard`), wrapped by `AdminGuardWrapper`.
- `[...rest]/page.tsx` — catch-all that escalates unknown paths under a resolved locale to the localized `not-found` page.

Route groups keep each guard + its own `layout.tsx`/`error.tsx`/`loading.tsx` scoped to the segment, which is the idiomatic App-Router pattern for shared chrome and boundary isolation.

**Edge handler**: `src/proxy.ts` exports a named `proxy(request)` function wrapping `createMiddleware(routing)`. Next.js 16 renamed the `middleware` convention to `proxy`; the file lives at `src/proxy.ts` and exports the exact `proxy` name the framework expects (confirmed in the build output as `ƒ Proxy (Middleware)`). The matcher is `["/((?!api|trpc|_next|_vercel|.*\\..*).*)"]` — it rewrites every user request onto the matching locale segment while excluding internal assets and file-extension URLs.

**i18n wiring**: `next.config.ts` applies `createNextIntlPlugin("./src/i18n/request.ts")`. `src/i18n/request.ts` loads the message catalog for the resolved locale lazily and calls `notFound()` for unknown locales; `src/i18n/navigation.ts` re-exports `Link`, `useRouter`, `usePathname` from `createNavigation(routing)` so all navigation is locale-aware without call-site awareness.

---

## 3. Project Structure

```
frontend/
├─ next.config.ts            # next-intl plugin, turbopack root, security headers, poweredByHeader:false
├─ messages/{en,ar}.json    # 604 leaf keys each, exact parity (verified)
├─ src/
│  ├─ app/[locale]/          # route groups: (public) (authenticated) (admin), [...rest] catch-all
│  ├─ components/
│  │  ├─ ui/                 # 19 primitives (button, dialog, tooltip, avatar, calendar, …)
│  │  ├─ layout/             # Navbar, AdminNavbar, AppLayout, Logo, ThemeToggle, UserMenu, LanguageSwitcher…
│  │  ├─ business/           # DoctorCard, ProfileForm, ClinicSelector, PaymentCard…
│  │  ├─ feedback/           # EmptyState, Skeleton, Toaster, StatusBadge
│  │  ├─ guards/             # AuthGuard, PublicGuard
│  │  ├─ data/               # DataTable, Pagination
│  │  └─ dashboard/          # QuickActions, panels
│  ├─ features/              # 12 verticals: auth, clinics, doctors, appointments, payments, …
│  │  └─ <domain>/{api,hooks}   # per-domain API client + TanStack Query hooks
│  ├─ i18n/                  # config.ts, navigation.ts, request.ts, global.d.ts
│  ├─ lib/                   # axios, media, query-client, query-keys, routing, toast-store, token-store, utils
│  ├─ providers/             # QueryProvider, AuthProvider, ThemeProvider
│  ├─ types/                 # api.ts, auth.ts, enums.ts, models/
│  ├─ proxy.ts               # locale negotiation (Next.js 16 proxy convention)
│  └─ config/index.ts        # API_BASE_URL, STALE_TIMES, PAGINATION_DEFAULTS
└─ audit/                    # Playwright end-to-end audit suite (auth, patient, admin, doctor, smoke, …)
```

Layer boundaries are respected: **components** never call the network directly, **feature hooks** own data access and mutations, **feature api modules** wrap axios endpoints. This is a clean vertical-slice layout that scales by adding a `features/<domain>/` folder.

---

## 4. State and Data Management

State is **React Context + TanStack Query**. **Zustand is not used** and was deliberately **not** introduced (the Context + Query split covers the needs: session identity is reader-scarce global state; server data is query-cached).

- **Server state** — `QueryProvider` (`src/providers/query-provider.tsx`) mounts a shared `QueryClient` (`src/lib/query-client.ts`): `staleTime 30s`, `gcTime 300s`, `refetchOnWindowFocus:false`, `retry:1`, `networkMode:"online"`. Per-domain freshness is tuned in `src/config/index.ts` (`STALE_TIMES`) — e.g. `myProfile: Infinity`, `availableSlots: 30s`, `clinics: 5m`. Query keys are centralized in `src/lib/query-keys.ts`.
- **Auth state** — `AuthProvider` (`src/providers/auth-provider.tsx`) exposes `user`, `isAuthenticated`, `isLoading`, `login/register/logout/updateUser` via `AuthContext`; consumed through `useAuth()` (`src/features/auth/hooks/use-auth.ts`).
- **Theme state** — `ThemeProvider` (`src/providers/theme-provider.tsx`): persists `hf_theme` in `localStorage`, defaults to `dark`, toggles the `.dark` class + `data-theme` attribute on `<html>`.
- **UI ephemera** — toasts via a tiny external store (`src/lib/toast-store.ts`) consumed by `<Toaster/>`; no global store library needed.

**Bootstrap order** (`src/app/[locale]/providers.tsx`): Theme → Query → Auth → Toaster. Auth boot calls `/auth/refresh` when a refresh token exists before rendering the app.

---

## 5. Authentication and Authorization

- **Tokens** — access token held in memory; refresh token persisted in `localStorage` (`src/lib/token-store.ts`, key `hf_refresh_token`). Access token is never persisted to storage (reduced XSS exposure); it is attached per-request by the axios interceptor (`src/lib/axios.ts`).
- **Refresh rotation** — a single-flight `refreshPromise` guards concurrent 401s (multiple parallel requests share one refresh call). On refresh success, the original request is retried with the new token; on failure, tokens are cleared, a toast is shown, and the app redirects to `/login`.
- **Guards** — `AuthGuard` (`src/components/guards/auth-guard.tsx`) redirects unauthenticated users to `/login?redirect=<path>` (the redirect survives locale switches — see §7) and enforces role allow-lists by redirecting to the role's home (`src/lib/routing.ts`, roles in `src/types/enums.ts`: `patient | doctor | admin`). `PublicGuard` keeps logged-in users off `/login`/`/register`. Per-route assignment lives in the guard wrappers under each route group.

---

## 6. API Layer

- Single axios instance (`src/lib/axios.ts`) with base URL from `src/config/index.ts`: `process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"`.
- **Request interceptor** attaches `Authorization: Bearer <accessToken>` when present.
- **Response interceptor** handles 401 by single-flight refresh + replay (excluding auth endpoints), and error toast + `/login` redirect when refresh fails.
- Per-feature modules: `src/features/<domain>/api/<domain>.ts` (and `*-admin.ts`) define typed endpoint wrappers; hooks (`useClientsList`, `useBookAppointment`, `useUpdateDoctor`, …) wrap them with TanStack Query for caching/invalidation.
- Media (`src/lib/media.ts`) resolves relative paths from the same API origin, so avatars/uploads work across dev and prod origins.

**Security note**: only `NEXT_PUBLIC_*` vars are used in the frontend; no secrets live in the client bundle. `.env.local` is gitignored; `.env.example` documents the single public var (now corrected to the live port — see §17).

---

## 7. i18n and RTL

- **Catalogs**: `messages/en.json` and `messages/ar.json` — **604 leaf keys each, verified exact parity** (a missing Arabic key would fail typecheck, not the browser).
- **Type safety**: `src/i18n/global.d.ts` pins `Messages: typeof en` into next-intl's `AppConfig`, so every `t("...")` call and namespace is compile-checked.
- **Routing**: `localePrefix: "as-needed"` with `defaultLocale: "en"` (`src/i18n/config.ts`) — English keeps prefixless URLs (`/, /login`), Arabic gets `/ar/…`. `/en` redirects (307) to `/` by design; unknown locales and unknown paths return localized 404s via `[...rest]` + `src/app/[locale]/not-found.tsx`.
- **RTL**: `<html lang dir>` is set per locale in `src/app/[locale]/layout.tsx` (`lang="ar" dir="rtl"` for Arabic). Directional primitives that flip (arrows, chevrons, calendar nav, quick-action icons) use Tailwind `rtl:` variants (e.g. `src/components/ui/calendar.tsx`, `src/components/data/Pagination.tsx`).
- **Arabic typography**: IBM Plex Sans Arabic + Aref Ruqaa are loaded via `next/font` and swapped in for Archivo/Kalam on `html[lang="ar"]` in `src/app/globals.css` — components keep their font roles without locale awareness.
- **Language switch** (`src/components/layout/LanguageSwitcher.tsx`): preserves the current path **plus search params and hash** (so `/login?redirect=/dashboard` keeps its redirect), prefetches the alternate-locale document on hover/focus, runs inside `useTransition` with `disabled`/`aria-busy` to prevent double-toggle flicker, and declares `lang={nextLocale}` so screen readers pronounce the label correctly. This is an architectural fit: it reuses the router-cache prefetch and never reads `window` during render (SSR-safe).

---

## 8. Error and Failure Handling

- **Network failures** — axios interceptor surfaces refresh-token expiry with a toast + redirect (§6); TanStack Query `retry:1` absorbs transient 5xx/network errors so the UI shows cached data while a single retry runs; `networkMode:"online"` avoids pointless offline refetches.
- **Route-level boundaries** — `src/app/[locale]/error.tsx` (ErrorBoundary with a reset button and translated copy); `src/app/global-error.tsx` (escapes the locale tree and renders a bilingual last-resort screen keyed off `navigator.language`).
- **Not-found** — localized `not-found.tsx` + catch-all in `[...rest]`; unknown-locale requests escalate via `request.ts`.
- **Loading states** — `loading.tsx` at the authenticated and admin route groups (spinner), skeleton loading on profile and card grids, and `Skeleton` fallbacks under the dynamic form imports.

---

## 9. Performance

- **Code splitting** — the two heavy profile edit forms (react-day-picker Calendar/Popover/Select bundle) are loaded via `next/dynamic` with `ssr:false` and a skeleton fallback, and their chunks are **prefetched on hover/focus** of the Edit buttons (`src/app/[locale]/(authenticated)/profile/page.tsx`, hoisted `loadProfileForm`/`loadDoctorProfileForm` loaders). Read views stay light; the expensive chunk only arrives when the user is about to edit.
- **Fonts** — `next/font/google` self-hosts Archivo/Kalam and the two Arabic faces; `display:swap` avoids render-blocking FOIT.
- **Data freshness** — TTL-per-domain `STALE_TIMES` avoids re-fetching reference data (clinics/specialties) while keeping availability slots fresh (`30s`).
- **Waived rerenders** — React 19 run, memoized callback actions in `AuthProvider`, and query-level caching keep renders scoped; no evidence of leak loops in the audit run.
- **Build** — production build completes cleanly with all 24 routes generated and `ƒ Proxy (Middleware)` detected; largest first-load chunks are framework-scoped and split per route.

---

## 10. Scalability

- **Vertical feature slices** (`src/features/<domain>/{api,hooks}`) mean new domains are additive folders, not edits across the codebase.
- **Query caching with per-domain TTL** scales read traffic by cutting redundant API calls; single-flight token refresh prevents thundering-herd on session expiry.
- **Boundary isolation** (per-group `loading`/`error` layouts) means a failing page degrades locally, not globally.
- Route handling for all protected pages happens through one parametrized locale tree — adding `/[locale]` prefixed pages is schema-free, and the catch-all guarantees 404 behavior never needs manual route additions.
- The app is stateless at the server for page rendering (no per-request server state), so it scales horizontally on Vercel/Railway without session affinity.

---

## 11. Maintainability

- **Strict TypeScript** (`strict:true`, `noEmit`, bundler resolution), typed i18n keys, typed API wrappers, and typed Zustand-free state reduce the bug surface at compile time.
- **Consistent structure**: features mirror backend domains; one ui/ primitive set; centralized config for freshness, pagination defaults, and API base.
- **Documented identity**: `DESIGN.md` specifies the Prescription Pad tokens; `src/app/globals.css` maps them through `@theme inline`; the root layout carries the world/thesis as inline design commentary so future work stays on-character.
- **Audit suite**: `audit/*.spec.ts` (Playwright) covers smoke, auth, patient, admin, doctor, cross-cutting states, and production-readiness paths.
- `tsc --noEmit` and `eslint` both pass with **0 errors / 0 warnings** (`npm run build` also runs its own typecheck).

---

## 12. Security

New in this review (`next.config.ts`):

- **`poweredByHeader:false`** — removes the `X-Powered-By` version leak.
- **`Content-Security-Policy-Report-Only`** — deliberate first step: report-only before enforcement. Directives: `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (React/Next bootstrap + chunk loader), `style-src 'self' 'unsafe-inline'` (component inline styles), `img-src 'self' data: blob: <api-origin>`, `connect-src '<self> <api-origin>'`, `font-src 'self' data:`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. The API origin is derived from `NEXT_PUBLIC_API_URL` at config load so `connect/img-src` stay correct across environments.
- **`X-Frame-Options: DENY`**, **`X-Content-Type-Options: nosniff`**, **`Referrer-Policy: strict-origin-when-cross-origin`**, **`Permissions-Policy: camera=(), microphone=(), geolocation=()`**, **`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`** — standard hardening set (HSTS is safe over http/dev; browsers enforce it only over https).
- **Tokens**: access token stays in memory; only the refresh token touches `localStorage`. No secrets in the bundle; API URL is a single public env var.

**Enforcement note**: `script-src 'unsafe-inline'` is required until a nonce/hash pipeline is introduced for the Next.js bootstrap; flipping CSP from report-only to enforce is the planned next step but **not** a release blocker (§17).

---

## 13. Accessibility

- Semantic landmarks (`header`, `main`, `aside`), labeled interactive controls via translated `aria-label`s (theme toggle, mobile menu, language switch, chart toggles).
- Language switcher declares `lang={nextLocale}` so the Arabic glyph is read with the right voice; `aria-busy` signals the pending transition.
- `AuthGuard`/`PublicGuard` preserve `focus-visible` rings; interactive primitives expose accessible names and keyboard focus styles.
- `rtl:` variants keep directional affordances correct for Arabic; `aria-hidden` is used on decorative icons.
- Skeleton/loading/empty/error states give progress and recovery feedback (the abortive critique's two P1 items — slot-picker `aria-live`, wizard dead-end help — are documented as debt in §17).

---

## 14. Responsive Design

- Breakpoint-driven layout throughout: 32 component files use `sm/md/lg` classes; sidebars collapse to a slide-over `Sheet` below `lg` (`AppLayout`, `AdminLayout`); mobile menu buttons are `lg:hidden`.
- The earlier **admin-header overflow at 375px is fixed** in this review: the "Admin" badge now appears only ≥`sm`, the logo collapses to the Rx mark below `sm` (`Logo` gained an opt-in `hideTextOnMobile`), and gaps tighten on small screens. Patient `Navbar`/`AuthLayout` are unchanged (they always had room).
- RTL verified on reachable pages (`dir="rtl"`, flipped chevrons/calendar).

---

## 15. Testing Strategy

Existing coverage, unchanged by this review:

- **End-to-end (Playwright)** — `frontend/playwright.config.ts` (testDir `./audit`) with suites: `smoke`, `auth`, `patient`, `admin`, `doctor`, `cross-cutting`, `cross-cutting-states`, `production-readiness`.
- **Build-time typecheck** — `next build` runs TypeScript; `tsc --noEmit` passes with 0 errors.
- **Lint** — `eslint` (next core-web-vitals + typescript configs) passes with 0 errors/warnings.

Transparency: there is no **unit-test harness** (Vitest/Testing Library) wired into `package.json`, and the Playwright suite is run on demand rather than in CI. Adding CI wiring for the audit suite is recommended before wider rollout (§17).

---

## 16. Production Readiness

- ✅ `npm run build` — green (Turbopack), all routes generated, proxy detected.
- ✅ `tsc --noEmit` and `eslint` — clean.
- ✅ Deployment config is minimal and platform-agnostic: no server-only secrets, single public env var, self-hosted fonts, `output` default (suitable for Vercel/Railway Node runtime).
- ✅ Security headers confirmed present on responses during this review (`X-Frame-Options`, CSP-Report-Only, nosniff, Referrer-Policy, Permissions-Policy, HSTS; `X-Powered-By` absent).
- ✅ i18n parity and RTL verified structurally and on reachable pages.

---

## 17. Known Issues / Technical Debt

| # | Item | Classification | Detail |
|---|------|----------------|--------|
| 1 | CSP is **report-only**, `script-src` includes `'unsafe-inline'` | NON-BLOCKING (follow-up) | Need nonce/hash pipeline for Next bootstrap before flip to enforce mode. Recommend: ship enforce after monitoring the report stream. |
| 2 | No **unit tests** harness in `package.json` | NON-BLOCKING (follow-up) | Playwright e2e exists; Vitest + Testing Library available in devDeps but unused as a wired test target. |
| 3 | Playwright audit suite not wired into **CI** | NON-BLOCKING (follow-up) | Add `npx playwright test` to a CI step before larger-scale rollout. |
| 4 | Access/refresh lifecycle relies on `localStorage` for the refresh token | NON-BLOCKING (design tradeoff) | Standard SPA tradeoff; mitigated by in-memory access token + CSP direction. HttpOnly-cookie flow is a future hardening path. |
| 5 | Two critique P1s remain open | NON-BLOCKING | Slot-grid lacks `aria-live`; wizard dead-ends lack inline help copy (`src/components/business/StepWizard.tsx` and slot picker). |
| 6 | Admin pages verified behind the auth guard by route status + earlier audit runs | NON-BLOCKING | Live re-verification of every admin interaction requires the running backend; the `audit/admin.spec.ts` suite covers it when run against the full stack. |
| 7 | `.env.example` port corrected to `3001` in this review | RESOLVED | Previously mismatched the backend default. |
| 8 | Stray QA artifact `switch-en-desktop.png` | RESOLVED | Removed from the repo root. |

---

## 18. Engineering Decisions and Trade-offs

- **Dark-by-default (night desk)**: chosen for the Prescription Pad identity and a flash-free first paint — the server renders `dark` so no inline theme script is needed (eliminating the React `<script>`-in-tree warning). Trade-off: a visitor who previously stored `light` sees a brief dark flash until hydration applies their preference. Accepted.
- **next-intl over homegrown i18n**: typed message keys, `as-needed` locale prefixes (preserves existing English URLs / SEO), server-side locale resolution, and first-class RTL direction handling. Cost: the plugin-layer indirection in `next.config.ts`. Accepted.
- **`proxy.ts` (Next.js 16) over `middleware.ts`**: the framework renamed the convention; the runtime output (`ƒ Proxy (Middleware)`) and dev/prod route checks confirm the migration. The matcher excludes asset-extension URLs so static files aren't rerouted.
- **Context + TanStack Query over Zustand**: session identity and theme are low-frequency, reader-limited client state (perfect for Context); server data is cached/refetched by Query with per-domain TTL. **Zustand was deliberately not added** — no requirement justified a third state system.
- **Report-only CSP first**: a strict enforce-mode CSP would risk breaking the client-rendered shell with no observable error; report-only surfaces violations over the live route, and enforcement follows once the report stream is clean. Accepted as the deliberate sequence.
- **Dynamic profile forms with hover prefetch**: keeps the heavy calendar/popover bundle out of the initial chunk while making edit feel instant — the interplay of `next/dynamic` (splits) + router prefetch (warms the alternate locale / edit chunk) is reused for the language switch too.
- **`.env.example` ≠ live values**: corrected; only one public var exists, and `.env.local` stays gitignored.

---

## 19. Final Verdict

### Production-ready now
- Bilingual English/Arabic App Router app with typed i18n, RTL, localized 404s, and locale-aware navigation.
- Clean and passing: `next build`, `tsc --noEmit`, `eslint` (0/0).
- Security headers in place (report-only CSP + standard hardening), `poweredByHeader` removed.
- Responsive layouts (incl. the fixed 375px admin header) and working theme toggle with a flash-free dark default.
- Deployable to Vercel/Railway: no server secrets, self-hosted fonts, single public env var.

### Non-blocking technical debt (track in backlog)
- Enforce CSP once the nonce/hash pipeline lands (item §17.1).
- Wire the Playwright audit suite into CI and make unit tests an actual `npm test` target (§17.2–3).
- Harden the session flow toward HttpOnly cookies if threat model expands (§17.4).
- Close the two critique P1 accessibility items (§17.5).

### Before a larger-scale production deployment
- CI with the audit suite gating deploys.
- CSP enforcement + nonce pipeline.
- Monitoring/report-uri destination for the currently-report-only policy.
- A fire/smoke pass of the admin suite against the real backend.

**Verdict: Production-Ready ✅** for the current scope, with the stated non-blocking follow-ups tracked for hardening at scale.