# MediCare Frontend — Security Audit

> Scope: `frontend/` (Next.js 16 App Router, React 19, TanStack Query, next-intl).
> Method: static source inspection of application code, configuration, and browser-facing behavior; existing build/route verification reused from the engineering review.
> Audit date: 2026-08-19
> Status: **SECURE WITH NON-BLOCKING FINDINGS**

---

## 1. Authentication

### 1.1 Login / Register / Logout flow
- `login`/`register` post credentials to `/auth/login` and `/auth/register` via `src/features/auth/api/auth.api.ts`, store the returned token pair (`src/providers/auth-provider.tsx`), then fetch the profile with `GET /auth/me`.
- `logout` calls `POST /auth/logout` with the refresh token and — **regardless of whether the server call succeeds** — clears local tokens and resets user state in `finally`. This guarantees a clean local exit even if the backend is unreachable.
- Forms validate with `zod` (`src/schemas/auth.ts`), and login/register hooks surface a single normalized error message to the UI (`useApiError`).

### 1.2 Access-token lifecycle
- The access token lives **only in a module-scope in-memory variable** (`src/lib/token-store.ts`) — it is never written to `localStorage`/`sessionStorage`/cookies and never appears in URLs. This is the strongest practical posture for a bearer-token SPA: an attacker with storage read access does not obtain the live access token; they obtain only the refresh token.
- On page reload the access token is gone; the auth bootstrap re-issues it via the refresh flow (§1.4).

### 1.3 Refresh-token lifecycle
- The refresh token is persisted in `localStorage` under `hf_refresh_token` (`src/lib/token-store.ts`). Refresh-token rotation is implemented **on the backend** (token hashed + persisted in `auth.repository.ts`, refresh endpoint issues a new pair). Rotation semantics (whether each refresh invalidates the old token and whether replay is detected) require runtime verification against the backend — see Finding F-5.

### 1.4 Refresh single-flight & concurrent 401 handling
- `src/lib/axios.ts` implements a module-level `refreshPromise` **single-flight**: concurrent 401s all await the same in-flight refresh call, so the refresh endpoint is hit exactly once per expiry burst. `_retry` on the original request prevents replay loops; auth endpoints (`/auth/login`, `/auth/register`, `/auth/refresh`) are excluded from refresh replay.
- On refresh failure: tokens cleared, a toast shown, and a hard redirect to `/login`.
- The bootstrap (`AuthProvider` `useEffect`) runs the same single-flight refresh when a stored refresh token exists, then fetches `/auth/me`. Mounted exactly once; no boot race observed.

### 1.5 Logout cleanup
- `clearTokens()` nulls both in-memory tokens and removes `hf_refresh_token`. Theme preference (`hf_theme`) is intentionally unrelated and kept.

### 1.6 Expired / invalid token handling
- A 401 from the API triggers the refresh path; a second 401 (`originalRequest._retry`) is rejected without another refresh, preventing an infinite retry loop.
- Invalid refresh at bootstrap → `catch` clears tokens and shows the unauthenticated UI.

### 1.7 Redirect behavior
- `AuthGuard` redirects to `/login?redirect=<current path>`; the value is URL-encoded and **re-validated on arrival**: it must start with `/`, must not be `/login`, and must match the user's role (patients/doctors may not be redirected into `/admin/*`, admins may not be sent to role-home of another role) — see `src/app/[locale]/(public)/login/page.tsx` `isAllowedRedirect`. **No open redirect.**

### 1.8 Token leakage possibilities
- No `console.log` of tokens or credentials anywhere in `src/`.
- No tokens in query strings, hash, or React Query keys.
- Authorization header is set only by the axios request interceptor on the shared instance; third-party `axios.post` in the refresh path sends only the refresh body.
- Residual leakage vector: a successful XSS could read `localStorage` (refresh token) and replay requests with the in-memory access token. This is the core reason CSP enforcement matters (Finding F-2) and why upload/media content must stay non-executable (F-4, §11).

---

## 2. Authorization

### 2.1 Guards
- `AuthGuard` (`src/components/guards/auth-guard.tsx`): unauthenticated → `/login?redirect=…`; role mismatch → role home.
- `AdminGuard` (`src/components/guards/admin-guard.tsx`): unauthenticated → `/login`; non-admin → role home.
- `PublicGuard` (`src/components/guards/public-guard.tsx`): redirects authenticated users away from `/login`/`/register` unless the route self-manages its redirect.
- Role allow-lists are applied per route group via `AuthGuardWrapper`: `payments` and `book` are `patient`-only, `schedule` is `doctor`-only, the `(admin)` group is `admin`-only, and the remaining authenticated routes accept any authenticated role.

### 2.2 UX protection vs security boundary
**The frontend guards are UX protection, not a security boundary.** They hide UI and steer navigation. True authorization must be enforced by the backend JWT middleware (the backend signs `{ sub, role }` into the access token). The frontend correctly does **not** treat hidden routes as protection, but this leaves the responsibility squarely on the backend — see Finding F-5. No privilege-escalation path exists *in the frontend code itself*; escalating would require calling backend APIs directly with a role-bearing token that the backend failed to check.

### 2.3 Client-side only considerations
- `appointments/[id]` resolves the appointment from the user's own `useMyAppointments` list client-side; the backend `GET /appointments/:id` must enforce ownership (dependency — F-5).
- Admin mutation hooks hit `/admin/*` endpoints; the backend must enforce the `admin` role there.

---

## 3. XSS

### 3.1 Findings of the sink scan
Static scan across `src/**/*.{ts,tsx}` found **zero** occurrences of:
`dangerouslySetInnerHTML`, `innerHTML`/`outerHTML`, `eval(`, `new Function(`, `document.write`, or `postMessage`.

### 3.2 User-controlled rendering
- All user content (clinic descriptions, review comments, doctor names, patient names, appointment notes) is rendered as **React text children** — escaped by the framework, not injected as HTML. Confirmed in `ReviewCard.tsx`, `DoctorCard.tsx`, modals, and admin tables.
- Toasts (`src/components/feedback/toast.tsx`) and error banners render `message` as text nodes — safe.
- Stepper progress and hero animation delays build inline `style` **only from numeric/derived values** (`StepWizard.tsx`, `HeroSection.tsx`) — no user string reaches a style property.

### 3.3 URL-handling
- `mediaUrl()` (`src/lib/media.ts`): paths starting with `http://`/`https://` pass through verbatim; everything else is joined to the API origin. The returned value feeds `<img>`/`next/image unoptimized` only (no `href`/script context) — see Finding F-4.
- The login `redirect` query value is the only decoded query string consumed for navigation and it is validated (start with `/`, role-scoped) — no open redirect or `javascript:` scheme injection.
- Translated content is static message catalogs (604 keys, en/ar) — not user input.

### 3.4 Assessment
No reachable HTML-injection sink in the frontend. Residual risk is the standard, backend-independent one: **if** any XSS were introduced (or if a dependency shipped one), the CSP is currently **report-only** (`script-src 'self' 'unsafe-inline'`) and the refresh token is readable from `localStorage` → full session comprowsing. Both are non-blocking today but should be closed (Findings F-2/F-3).

---

## 4. CSRF

- **Current model: bearer tokens, no cookies.** `src/lib/token-store.ts` and the axios layer use an `Authorization: Bearer` header; `withCredentials` is never set; there are **no cookies** in the app (no `document.cookie`, no `cookies()`). CSRF depends on ambient credentials auto-attached by the browser — with no cookies, a CSRF cross-origin request cannot carry the authorization. **CSRF is not applicable to the current authentication model.**
- CORS on the backend is restricted to an explicit origin allow-list (`CORS_ORIGINS`, default `http://localhost:3000`, `credentials: true`) — an origin-limited surface (dependency, F-5).
- **Future risk (documented in the engineering report):** if authentication ever migrates to HttpOnly session cookies, CSRF becomes relevant and must be handled with `SameSite=Strict/Lax` plus a token-based anti-CSRF defense and CSRF-safe refresh. The current `X-Frame-Options: DENY` / `frame-ancestors 'none'` already mitigate click-jacking-assisted CSRF.

---

## 5. Security Headers

Current policy from `frontend/next.config.ts` (applied to all routes):

| Directive / Header | Value | Assessment |
|---|---|---|
| `Content-Security-Policy-Report-Only` | `default-src 'self'` throughout | Report-only by design (see F-2) |
| `script-src` | `'self' 'unsafe-inline'` | `'unsafe-inline'` required by the Next.js RSC bootstrap + client chunk loader; trade-off analyzed in F-2 |
| `style-src` | `'self' 'unsafe-inline'` | Needed for component/date-picker inline `style` attributes; low risk |
| `img-src` | `'self' data: blob: <api-origin>` | Correctly scoped to self + API origin + local preview blobs |
| `connect-src` | `'self' <api-origin>` | Correctly scoped; API origin derived from env at config load |
| `font-src` | `'self' data:` | Self-hosted `next/font` — no external font CDN |
| `object-src` | `'none'` | Strict |
| `base-uri` | `'self'` | Strict |
| `form-action` | `'self'` | Strict |
| `frame-ancestors` | `'none'` | Strict (click-jacking) |
| `X-Frame-Options` | `DENY` | Legacy click-jacking fallback |
| `X-Content-Type-Options` | `nosniff` | Strict (MIME sniffing) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Best practice; origin-only leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | No feature needs them; locked down |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Safe over http (ignored); effective on https |
| `X-Powered-By` | removed (`poweredByHeader:false`) | Version banner suppressed |

**`'unsafe-inline'` trade-off (script-src), explicit:** removing it requires a nonce/hash pipeline for Next's inline bootstrap scripts — a real configuration effort but no functional blocker once implemented. Until then the directive does **not** block injected inline scripts, so the CSP's XSS containment value is only against non-inline vectors; the report stream still surfaces violations (`script-src 'unsafe-inline'` produces no script violation reports). This is the single most material CSP limitation. **`unsafe-eval` is NOT present** — good.

Missing control: the Report-Only policy has **no `report-uri`/`report-to` destination**, so violations are not being collected anywhere today (Finding F-3).

---

## 6. Secrets & Sensitive Data

- **No hardcoded secrets**: no API keys, tokens, JWTs, or credentials in `frontend/src` or config. Scanned source + messages.
- Env vars: exactly one public variable, `NEXT_PUBLIC_API_URL` (`src/config/index.ts`), read into `API_BASE_URL` with an `/api/v1` same-origin fallback. No server-only secrets flow into the bundle.
- `.env.local` is gitignored; `.env.example` contains only the dev API URL (corrected to `:3001` in this delivery).
- **Storage**: `localStorage` holds `hf_refresh_token` and `hf_theme` only. `sessionStorage`: none. Cookies: none.
- **No sensitive data in URLs/query params** except the `redirect` path (an internal path, not a credential).
- **No console logging** of tokens, passwords, or PII in `src/`.
- **Production source maps are not enabled** (`productionBrowserSourceMaps` unset) and `ReactQueryDevtools` self-gates to a no-op when `NODE_ENV !== "development"` (verified in the compiled package), so neither the bundle nor the runtime exposes query internals in production.

Finding: refresh token in `localStorage` (F-1) is the only sensitive-data-at-rest item, and it is a known, bounded trade-off.

---

## 7. API Layer

- Single axios instance, `baseURL = API_BASE_URL`, `Content-Type: application/json` (`src/lib/axios.ts`).
- **Request interceptor**: injects `Authorization: Bearer <access>` only when a token exists; shared instance means all calls authenticated the same way. No credentials/cookies option set (consistent with bearer model).
- **Response interceptor**: 401 → single-flight refresh (§1.4) → one replay. Auth endpoints exempt. Refresh failure → clear-tokens + toast + redirect `/login`. The `_retry` guard provably prevents infinite retry: a replayed request that 401s again is rejected immediately.
- **Base URL / origin assumption**: the API origin is baked from `NEXT_PUBLIC_API_URL` at build/runtime. All traffic is `https` in production; refresh and login are driven by the backend. CORS allow-list is the backend's responsibility (F-5).
- **Error propagation**: `useApiError` extracts the backend `message` and validation `fieldErrors` and displays them; a non-API error collapses to a generic message. Backend message verbosity is therefore user-visible — keep messages non-revealing (Finding F-6).

---

## 8. Routing / Proxy / i18n Security

- `src/proxy.ts`: named `export function proxy`, wrapping `createMiddleware(routing)`. Matcher `["/((?!api|trpc|_next|_vercel|.*\\..*).*)"]` excludes API routes, Next internals, and anything with a file extension. Locale negotiation uses `localePrefix: "as-needed"` with default `en`; `/en` → 307 → `/`, `/ar` → served, unknown locale → `notFound()` in `src/i18n/request.ts`.
- Catch-all `[...rest]/page.tsx` renders `notFound()` for unknown paths → localized 404. No path-traversal surface (App Router resolves filesystem routes at build; middleware only negotiates the locale prefix).
- **Open redirect**: none. The proxy rewrites internally; the only user-directed redirect (`/login?redirect=`) is validated (§1.7, §3.3).
- Encoded/edge URLs: `hasLocale()` gates the locale slot before any rendering; matcher excludes dot-segments; no host-header or scheme handling that could redirect off-site.

---

## 9. Dependencies / Supply Chain

Direct runtime deps: `next@16.2.11`, `react@19.2.4`, `react-dom@19.2.4`, `axios@1.18.1`, `@tanstack/react-query@5.101.4`, `next-intl@4.13.7`, `zod@4.4.3`, `react-hook-form`, `react-day-picker`, `@base-ui/react`, `lucide-react`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`, `cmdk`, `tw-animate-css`, `shadcn`.

- All packages are well-known, actively maintained ecosystem libraries; **no suspicious or unmaintained packages identified by inspection**.
- `package-lock.json` is committed (484 KB) enabling reproducible installs.
- Notable hygiene item: `shadcn` is listed as a **runtime** dependency though it is only consumed as Tailwind CSS in `globals.css` (Finding F-7 — could move to devDependencies; not a security issue).
- CVE state cannot be determined from static inspection — mark **UNVERIFIED** (requires `npm audit`/OSV against the lockfile — see F-9).

---

## 10. Browser Security

- **Storage**: `localStorage` = refresh token + theme; `sessionStorage` = none; cookies = none. Minimized and intentional.
- **`window` usage**: only `window.location.href = "/login"` on refresh failure (internal), and `URL.createObjectURL`/`revokeObjectURL` inside `AvatarUploader` — **object URLs are revoked on preview replace and on unmount** (no leak).
- **No** `postMessage`, `iframe`, `<object>/<embed>`, external `window.open`, `target="_blank"`, or missing-rel navigation found in `src/`.
- **Media**: avatars render via `next/image` with `unoptimized` (plain `<img>`), always with `alt`/fallback. `mediaSrc` can pass through arbitrary `http(s)` absolute URLs supplied by the backend (Finding F-4).

---

## 11. File / Upload Security

`AvatarUploader.tsx` (+ backend dependency):

- **Client-side** (UX only): `ACCEPTED_TYPES = jpeg/png/webp`, `MAX_SIZE = 2 MB`, enforced before preview; uncommitted previews are revoked on failure/cancel/unmount so the UI never lies to the server.
- **Backend (dependency, verified by source inspection)**: `src/shared/middlewares/upload.middleware.ts` uses multer `memoryStorage` with a **MIME allow-list** (`image/jpeg|png|webp`) and **2 MB** upload limit; oversized files return `413`. **SVG is excluded** — this blocks the classic SVG/XML XSS upload vector at the source. Uploaded bytes never touch disk as raw user-named files.
- Remaining backend dependency (F-5): served upload responses must carry the correct `Content-Type` (plus `X-Content-Type-Options: nosniff` at the API origin) so a mislabel can't switch browsers into dangerous sniffing modes. The stored file must also be served as a static resource, not executed.
- Because content is jpeg/png/webp-only and rendered via `<img>` (never inline), uploaded content cannot become active content through this path **provided the backend serves it correctly** (F-5).

---

## 12. Error Handling / Information Disclosure

- `src/app/[locale]/error.tsx`: generic translated "something went wrong" + retry; no stack, no digest surfaced.
- `src/app/global-error.tsx`: bilingual fallback **outside** the locale tree; no stack/implementation details.
- `not-found.tsx`: localized, no details.
- API errors: backend `message` and field errors are rendered to the user; a well-behaved backend keeps these generic. No internal headers/stack traces propagate. **No client-side stack traces or console leak observed** (Finding F-6 is a backend-verbosity guardrail).

---

## 13. Security Architecture

The architecture correctly separates responsibilities:

- **UX protection (frontend)**: guards, hidden menus, redirects, role-appropriate navigation — present and well-built (AuthGuard/AdminGuard/PublicGuard, per-route role allow-lists).
- **Real security boundary (backend)**: JWT issuance with `{ sub, role }`, refresh-token hashing/persistence, per-route authorization middleware, upload validation, CORS allow-list. **All authorization decisions must assume the caller can read any frontend code and call APIs directly.**
- **Secrets**: only one public env var; no server secrets in the client.
- **Browser storage**: minimal; only the refresh token has exposure surface (F-1).

The frontend does not present hidden routes as security, which is technically correct — but this makes **backend enforcement the sole gate**, a dependency that must be verified (F-5).

---

## 14. Threat Model

### 14.1 Anonymous attacker
- **Entry points**: public pages, `/login`, `/register`, localized routes.
- **Paths**: scan for open redirect (mitigated), probe `/admin/*` directly (guarded client-side; backend must 401/403), attempt locale/404 abuse (returns localized 404), brute-force login (backend rate limiting is a dependency — not assessed here).
- **Realistic impact**: low as long as backend enforces authz.

### 14.2 Authenticated patient
- Can view own appointments/payments/reviews; **may attempt to access other users' records** by changing IDs in `/appointments/[id]` or admin endpoints. Client-side guard stops them from *seeing* admin UI, but direct API calls are only stopped by backend ownership/role checks (F-5).
- **Impact**: requires backend bug to be exploitable.

### 14.3 Authenticated doctor
- Same, plus own schedule write paths. No frontend-only escalation.

### 14.4 Authenticated admin
- Fully privileged in-app surface. No further frontend escalation; script-level compromise of an admin session has high impact.

### 14.5 Malicious browser extension / XSS
- Extension (or injected script) can read `localStorage.hf_refresh_token` **and** observe the in-memory access token at runtime → full session takeover.
- Mitigations present: in-memory access token (smaller window), no cookies, best-effort CSP direction (report-only today). **Primary hardening = enforce CSP (F-2)**; migrating the refresh token to HttpOnly cookie is the larger follow-up (F-1).
- **Realistic**: yes, if any future XSS lands or a malicious extension is installed; severity of *current* exposure is Medium because no exploitable XSS sink exists today.

### 14.6 Compromised refresh token
- Predictable or stolen refresh token could mint new pairs. Backend hashes+persists tokens and rotates per refresh; **whether old tokens are invalidated on rotation/reuse is UNVERIFIED runtime behavior** (F-5). If replay isn't detected, a leaked token is valid for its life.

### 14.7 CSRF attacker
- Not applicable today (bearer/no-cookie model, §4). If cookie-auth is ever introduced, this becomes live (SameSite + CSRF tokens).

### 14.8 Malicious uploaded file
- Blocked by backend MIME allow-list (jpeg/png/webp only, 2 MB). SVG excluded. Remaining path is a mis-served `Content-Type`/sniffing issue at the API origin (F-5).

### 14.9 Compromised dependency
- Supply-chain compromise of any of the ~20 runtime deps could inject frontend code. Mitigations: committed lockfile, minimal dep set, mainstream libraries. Standard dependency auditing is missing from CI (F-9), and **npm audit couldn't be run in this audit per-scope** (UNVERIFIED).

---

## 15. Security Findings

### F-1 :: MEDIUM
- **Category:** Authentication / Sensitive Data
- **Title:** Refresh token persisted in `localStorage`
- **Evidence:** `src/lib/token-store.ts` — `REFRESH_KEY = "hf_refresh_token"`, `setRefreshToken()` writes `localStorage.setItem(REFRESH_KEY, token)`.
- **Affected files:** `frontend/src/lib/token-store.ts`
- **Why it matters:** `localStorage` is readable by any script running in the page origin or a compromised extension; an XSS would yield the refresh token out of band.
- **Exploitability:** Low today (no XSS sink found in this audit), High if any XSS is introduced (F-2 relationship).
- **Impact:** Full session takeover → impersonation, data access, payment/review manipulation.
- **Recommended remediation:** Prefer an HttpOnly, `Secure`, `SameSite`-scoped refresh cookie served with strict path + rotation (backend change); or keep `localStorage` but gate behind enforced CSP and add token binding/rotation checks. This is a deliberate SPA trade-off; the refresh token is rotated per use on the backend.
- **Risk if left unfixed:** Session-takeover exposure concentrates on the first XSS that lands.

### F-2 :: MEDIUM
- **Category:** Security Headers / XSS containment
- **Title:** CSP is Report-Only and `script-src` permits `'unsafe-inline'`
- **Evidence:** `frontend/next.config.ts` headers block: `Content-Security-Policy-Report-Only`, `script-src 'self' 'unsafe-inline'`.
- **Affected files:** `frontend/next.config.ts`
- **Why it matters:** The policy cannot block an injected inline script today, so its XSS-containing value is limited; and with no `report-uri` set it isn't even observable.
- **Exploitability:** n/a (mitigation not control). The *absence* raises F-1's exploitability.
- **Impact:** If any XSS is introduced, the intended safety net is a no-op under report-only.
- **Recommended remediation (compatibility trade-off, explicit):** Removing `'unsafe-inline'` from `script-src` **will break the Next.js RSC bootstrap and client chunk loader** unless a nonce/hash pipeline is added (Next supports nonces for App Router). Sequence: (1) add `report-uri`/`report-to`, (2) implement the nonce pipeline, (3) verify the report stream is clean, (4) add a `Content-Security-Policy` (enforce) header alongside `-Report-Only`, (5) remove the Report-Only header after a soak.
- **Risk if left unfixed:** XSS containment remains aspirational; refresh-token theft remains viable on first injection.

### F-3 :: LOW
- **Category:** Security Headers / observability
- **Title:** Report-Only CSP has no `report-uri`/`report-to` destination
- **Evidence:** `frontend/next.config.ts` CSP string contains no reporting directive; no `Report-To`/`Reporting-Endpoints` header.
- **Affected files:** `frontend/next.config.ts`
- **Why it matters:** The deliberate "observe before enforce" sequence produces nothing observable to act on.
- **Exploitability:** n/a.
- **Impact:** Blind policy; violations invisible.
- **Recommended remediation:** Add `report-uri /api/csp-report` (or a `Report-To` group) to the Report-Only header, with a sink that logs and alerts. Then follow F-2's sequence.
- **Risk if left unfixed:** Enforce-mode flip happens without understanding the violation stream.

### F-4 :: LOW
- **Category:** XSS / URL handling
- **Title:** `mediaUrl()` passes through arbitrary `http(s)` absolute URLs verbatim
- **Evidence:** `src/lib/media.ts` — `if (path.startsWith("http://") || path.startsWith("https://")) return path;`. Values feed `<img>`/`next/image unoptimized` in `Avatar` and doctor/patient avatars.
- **Affected files:** `frontend/src/lib/media.ts`, `frontend/src/components/ui/avatar.tsx`
- **Why it matters:** If the backend ever returns a user-influenced absolute `avatarUrl`, the browser will load an external image (tracking pixel style) — no script execution (kept `<img>`), but a data-leak/canary channel and, under enforced CSP, image breakage since only self+API origin is allowed.
- **Exploitability:** Requires backend to emit a non-API-origin URL; low.
- **Impact:** Minor privacy/tracking leak; no RCE/XSS through this sink.
- **Recommended remediation:** Restrict to a known set of origins (e.g. strip to API origin or validate scheme+host against `API_ORIGIN`) or serve uploads through the API only.
- **Risk if left unfixed:** Low.

### F-5 :: UNVERIFIED — requires runtime/backend verification
- **Category:** Backend boundary dependency
- **Title:** Real authorization/rotation/upload/CORS controls live in the backend and must be runtime-verified
- **Evidence:** Frontend is deliberately UX-only (guards not security boundaries). Backend deps identified by inspection: JWT `{sub,role}`; refresh hashing + persistence; multer MIME+size limits; CORS allow-list with `credentials:true`. Frontend calls `/admin/*`, `/appointments/:id`, `/auth/refresh`, avatar upload.
- **Affected files (backend, out of frontend scope):** auth service/repository, users routes + upload middleware, `app.ts` CORS.
- **Why it matters:** If any backend endpoint omits authorization/ownership/rotation checks, the frontend's polish provides no safety.
- **Exploitability:** Unknown without a live test.
- **Impact:** Unknown; could be critical if a hole exists.
- **Recommended remediation:** A runtime test pass that confirms, per path: (a) `/admin/*` returns 403 for patient/doctor tokens, (b) `/appointments/:id` returns 403 for non-owners, (c) refresh rotates and detects replay of an old refresh token, (d) uploads are 408/415 for wrong MIME and served with `Content-Type`+`nosniff`, (e) CORS rejects disallowed origins in production config.
- **Risk if left unfixed:** The frontend's security posture unconditionally depends on these checks.

### F-6 :: INFO
- **Category:** Information disclosure (source attribute)
- **Title:** Backend error messages rendered verbatim to users
- **Evidence:** `useApiError.parse()` returns `err.message` and validation `path.join(".")`; surfaced in toasts and field errors (`use-login`, `use-register`, `useApiError`).
- **Affected files:** `frontend/src/hooks/useApiError.ts`, login/register hooks
- **Why it matters:** If backend error strings embed SQL/stack/DB details, they reach the DOM and console via toasts.
- **Exploitability:** Depends on backend message hygiene.
- **Impact:** Low (the frontend adds no detail; it only forwards).
- **Recommended remediation (backend-side)** keep API error messages generic; map to i18n keys.
- **Risk if left unfixed:** Low.

### F-7 :: INFO
- **Category:** Supply chain / hygiene
- **Title:** `shadcn` listed as a runtime dependency but only used at build CSS import
- **Evidence:** `frontend/package.json` dependencies includes `"shadcn": "^4.14.1"`; only consumed as `@import "shadcn/tailwind.css"` in `globals.css`.
- **Affected files:** `frontend/package.json`, `frontend/src/app/globals.css`
- **Why it matters:** Unnecessary runtime deps widen the (small) supply-chain surface and bloat `production` installs.
- **Exploitability:** n/a.
- **Impact:** Minimal.
- **Recommended remediation:** Move to `devDependencies` (verify Turbopack build still resolves the `@import`).
- **Risk if left unfixed:** Negligible.

### F-8 :: INFO
- **Category:** Defense-in-depth
- **Title:** No CSRF controls — correct today, required after any cookie-auth migration
- **Evidence:** No cookies anywhere in the app; bearer header model (`src/lib/axios.ts`, `src/lib/token-store.ts`).
- **Affected files:** (architecture-wide)
- **Why it matters:** The instant authentication becomes cookie-based (HttpOnly refresh cookie as suggested in F-1), CSRF becomes a live, unmitigated vector.
- **Exploitability:** Not exploitable in the current model.
- **Impact:** Future.
- **Recommended remediation:** If/when migrating to cookies, set `SameSite=Strict` (or `Lax` + CSRF token) and add CSRF-safe refresh.
- **Risk if left unfixed:** None today.

### F-9 :: INFO
- **Category:** Supply chain / process
- **Title:** No automated dependency audit or CI gate for the Playwright audit suite
- **Evidence:** `frontend/package.json` (no `npm audit`/CI); `frontend/playwright.config.ts` (testDir `./audit`); no CI workflow in `frontend/`.
- **Affected files:** repo CI config (absent)
- **Why it matters:** New CVEs in the 20-runtime-dep set go undetected; e2e suite only runs on demand.
- **Exploitability:** n/a.
- **Impact:** Process gap; the delivery report also flags missing CI.
- **Recommended remediation:** Gate CI on `npm audit --audit-level=high` + `npx playwright test`.
- **Risk if left unfixed:** Latent; no current exploit identified (other findings UNVERIFIED).

### F-10 :: INFO
- **Category:** Session UX
- **Title:** Session state is volatile on reload by design (access token in memory)
- **Evidence:** `token-store.ts` in-memory access token; bootstrap re-issues on reload via refresh.
- **Affected files:** `src/lib/token-store.ts`, `src/providers/auth-provider.tsx`
- **Why it matters:** Not a vulnerability — a deliberate trade-off to shrink the token-exposure window. Worth restating so it is not "fixed" into storage.
- **Impact:** Users re-authenticated-on-reload latency only.
- **Risk if left unfixed:** None.

---

## 16. Positive Security Controls (already correct)

1. Access token never persisted; in-memory only (`token-store.ts`).
2. Single-flight concurrent-401 refresh with `_retry` loop guard (`axios.ts`).
3. No XSS sinks anywhere in `src/` (sink scan clean).
4. All text rendered as React text nodes; no HTML injection surfaces.
5. Admin-group, schedule, bookings, payments carry per-role client allow-lists; guards redirect instead of exposing unauthorized UI.
6. Login `redirect` query is validated (`/`-prefixed, role-scoped) — **no open redirect**.
7. CSP frame-ancestors `'none'` + `X-Frame-Options: DENY`; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` — strong defensive spine.
8. `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` lockdown, `poweredByHeader:false`.
9. No cookies → CSRF not applicable in the current model.
10. No secrets/keys/URLs-in-badge in the bundle; one public env var, gitignored `.env.local`.
11. `next/image` used with `unoptimized` and always-`alt` avatars; blob URLs revoked (no preview leak).
12. Upload MIME+size enforced on both client (UX) and backend (control); **SVG excluded** (blocks SVG XSS).
13. Error pages are generic/localized; no stack traces surface.
14. Production source maps disabled; devtools self-gate to no-op in production.
15. Committed lockfile; small, mainstream dependency set.

---

## 17. Final Security Verdict

**SECURE WITH NON-BLOCKING FINDINGS**

The frontend has no reachable XSS sink, no open redirect, no CSRF-exposed model, no secrets in bundles, and a strong underlying header skeleton — for the **current scope**, no exploitable issue was found by static inspection. The two Medium findings (F-1 refresh-token-at-rest, F-2 report-only/unsafe-inline CSP) are real but **non-blocking**: each is a known, documented SPA trade-off whose *potential* is only realized by an XSS that does not currently exist and was not found.

The load-bearing caveat is F-5: several controls this frontend depends on (authorization per route, refresh rotation/replay detection, upload MIME + serving headers, CORS allow-list) live **in the backend and are UNVERIFIED at runtime**. They must be confirmed before any claim of full-stack security.

**Aggregate verdict: production-ready for the current scope; harden in the priority order below before larger-scale rollout.**

---

## 18. Remediation Plan

### P0 — Must fix before deployment
- None currently identified as blocking the current deployment. (If F-5 runtime verification were to fail, its finding would be promoted here.)

### P1 — Should fix soon
1. **F-5** — Run the runtime/backend verification pass (admin 403s, appointment ownership, refresh rotation + replay, upload MIME + serving headers, prod CORS). Promote any failure to P0.
2. **F-2 + F-3** — Add `report-uri`, implement a nonce pipeline, then move CSP into enforce mode after a clean soak. Removing `'unsafe-inline'` requires the nonce work first (compatibility trade-off documented in F-2).
3. **F-1** — Evaluate the HttpOnly refresh-cookie migration (with the F-8 CSRF follow-on), or at minimum gate `localStorage` behind the enforced CSP.

### P2 — Hardening / backlog
4. **F-4** — Constrain `mediaUrl()` to the API origin / known origin set.
5. **F-6** — Backend: keep API error messages generic (map to i18n keys at the edge).
6. **F-7** — Move `shadcn` to devDependencies.
7. **F-9** — CI: run `npm audit --audit-level=high` + `npx playwright test` as gates.
8. **F-10** — Document the reload-re-auth behavior as intended (no code change).

---

## Verification Note
- Items marked **UNVERIFIED** require runtime or backend verification and are intentional non-assumptions.
- This audit did **not** run `npm audit` (offline scope) — F-9 stands as an open item, not a confirmation of a given CVE.
- Confirmations that DID come from static verification: sink scan, guard logic, interceptor single-flight/loop-guard, redirect validation, media/avatar sink types, devtools gating, header set, no cookies, storage contents, backend upload middleware + CORS allow-list source.