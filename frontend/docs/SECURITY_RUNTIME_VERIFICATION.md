# MediCare Backend — Security Runtime Verification

> Verification of Security Audit finding **F-5** (the only UNVERIFIED finding) against the real, running backend.
> Scope: backend API (`Express 5 + TypeScript + PostgreSQL`), repo root. Frontend code was not used or modified.
> Method: live HTTP requests to the running backend with real JWT sessions; no source/config/package changes.
> Date: 2026-08-19

---

## 1. Executive Summary

The backend security boundary was exercised with **live HTTP requests** against a real running instance (dev config, existing test database). All five F-5 components were tested, and every one **passed** in its live behavior:

| F-5 Component | Result |
|---|---|
| A. Admin authorization | **VERIFIED** — patient/doctor tokens get 403 on admin routes; unauthenticated gets 401; admin gets 200 and can mutate |
| B. Appointment ownership | **VERIFIED** — `/appointments/mine` is user-scoped server-side; cross-patient reads/cancels rejected (403); unauthenticated rejected (401) |
| C. Refresh rotation | **VERIFIED** — refresh returns a new pair and the old token is revoked server-side |
| D. Refresh replay detection | **VERIFIED** — reusing a rotated (revoked) refresh token returns 401; concurrent use of one token yields one 200 + one 401 |
| E. Upload validation | **VERIFIED** — MIME allow-list + `sharp` content re-decode/re-encode + 2 MB size limit; SVG/HTML/plain-text/size-overrun rejected; content spoofing rejected |
| F. Upload serving headers | **VERIFIED** — served as re-encoded `image/webp` with correct `Content-Type`, cache headers, `ETag`, range support; not fooled by `Accept: text/html` |
| G. CORS | **VERIFIED** — configured origin `http://localhost:3000` echoed; foreign origins (`evil.com`, other ports, `null`) get **no** `Access-Control-Allow-Origin` → browsers block |

Existing automated checks: backend typecheck ✓, production build ✓. The `db:test` SQL validation harness aborts early because the test database already contains seeded data — a pre-existing fixture collision, not a security regression.

**No security blockers found. The F-5 finding is resolved by runtime evidence.**

---

## 2. Environment Tested

| Item | Value |
|---|---|
| Runtime | `tsx src/server.ts` (dev mode, `NODE_ENV=development`) |
| Port | `:3001` |
| Database | PostgreSQL 17 in Docker container `clinic-postgres`, `clinic_booking` DB |
| Env | `.env` (existing repo file, **not modified**); `JWT_SECRET`, `JWT_REFRESH_SECRET`, 15m/7d TTLs |
| CORS | not set in `.env` → code default `http://localhost:3000` (`src/config/env.ts`, `src/app.ts:11`) |
| Uploads | `uploadConfig.dir` from `src/config/upload.ts` → `uploads/` directory |

Test identities (existing seeded accounts, password `AuditPass123!`):
- `audit_admin@test.com` (admin)
- `audit_doctor@test.com` (doctor)
- `audit_1785758490@test.com` (patient A)
- Temporary patient B + rotation/concurrency users were registered through the public API and **removed afterwards** (see §13).

Backend entry: `src/server.ts` → `connectDatabase()` → `runMigrations()` → `app.listen(PORT)`. Root layout: `src/app.ts` (CORS, JSON, `/uploads` static, `/health`, `/api/v1`, error middleware).

---

## 3. Test Methodology

1. **Phase 0 — Inspection**: read middleware (`src/shared/middlewares/auth.middleware.ts`, `upload.middleware.ts`), route tables (`src/routes/index.ts`, all module `*.routes.ts`), services (auth, appointments, avatar-storage), config (env, upload, jwt), app assembly (`src/app.ts`), and the existing test harness (`src/database/tests/*.sql`).
2. **Phase 1 — Environment**: verified deps installed, DB reachable, migrations idempotent, backend boots and serves `/health`.
3. **Phases 2–5 — Live HTTP tests**: real `curl` requests with real JWT tokens against `http://localhost:3001`. No mocks, no frontend in the loop, no client-side guards involved.
4. **Phase 6 — Automated**: `tsc --noEmit`, `npm run build`, `db:test` SQL validation (via `docker exec` since host lacks `psql`).
5. **Cleanup** — all temporary users, the test appointment slot, appointments, and uploaded avatar files were removed; `audit_admin@test.com` avatar pointer was reset to `NULL` (it had been overwritten by an upload test). Repo `git status` shows **no backend file changes**.

Every claim below is labeled with the exact request sent and the observed status code.

---

## 4. Authorization Results

Middleware under test: `authenticate` (JWT verify) + `authorize(...permissions)` mapping `RolePermissions` (`src/shared/constants/permissions.ts`). Admin routers all mount `router.use(authenticate, authorize(<MANAGE_* permission>))` at the mount point (`src/modules/{clinics,specialties,doctors,patients,appointment-slots,users}/*.routes.ts`), so every admin route inherits the guard.

### 4.1 Admin GET — `GET /api/v1/admin/users`

| Actor | Expected | Actual | Result |
|---|---|---|---|
| patient token | 401/403 | **403** | PASS |
| doctor token | 401/403 | **403** | PASS |
| admin token | 200 + privileged data | **200** | PASS |
| no token | 401 | **401** | PASS |

### 4.2 Admin mutation — `POST /api/v1/admin/users` (create user)

| Actor | Expected | Actual | Result |
|---|---|---|---|
| patient token | 401/403 | **403** | PASS |
| doctor token | 401/403 | **403** | PASS |

### 4.3 Admin allowed where expected — admin `PATCH /admin/users/:id`

- Admin token `PATCH /api/v1/admin/users/<uuid>` `{"isVerified":true}` → **200**, value reflected in DB (`t`). Admin can mutate as authorized. PASS.
- Cleanup: admin `DELETE /api/v1/admin/users/<uuid>` → **204** (soft delete).

### 4.4 Cross-role leakage checks (both directions)

- Doctor-only endpoint `GET /doctor-schedules/me`:
  - doctor → **200**; patient → **403**; admin → **403** (admin deliberately lacks `MANAGE_OWN_SCHEDULE`). PASS — no over-permissioning.

Source: `src/modules/doctors/doctor.routes.ts`, `src/modules/users/users.routes.ts`, `src/modules/appointment-slots/appointment-slot.routes.ts`, `src/modules/doctor-schedules/doctor-schedule.routes.ts`.

---

## 5. Appointment Ownership Results

Setup via the public API (real flow): patient A (`audit_1785758490@test.com`) booked slot `f266bb4f…` → appointment `246cfb07…` (201). A second patient (patient B) was registered and logged in. An admin-created slot was used only to create the scenario; it and its appointments were removed afterwards.

| Test | Actor | Expected | Actual | Result |
|---|---|---|---|---|
| `GET /appointments/mine` | patient A | contains own appointment | **200, includes `246cfb07…`** | PASS |
| `GET /appointments/mine` | patient B | must NOT contain A's appointment | **200, zero leak** (0 appointments) | PASS |
| `PATCH /appointments/mine/:id` (cancel A's) | patient B | 403 ownership | **403** "You can only cancel your own appointments" | PASS |
| `PATCH /appointments/mine/:id` (cancel own) | patient A | 200 | **200** (status → cancelled) | PASS |
| `GET /appointments/:id` | patient B | 401/403 (admin-only route) | **403** | PASS |
| `GET /appointments/:id` | patient A | 401/403 (admin-only by design) | **403** (by design) | PASS |
| `GET /appointments/:id` | admin | 200 | **200** | PASS |
| `GET /appointments/:id` | unauthenticated | 401 | **401** | PASS |
| `GET /appointments/mine` (list) | unauthenticated | 401 | **401** | PASS |

Doctor access: `GET /appointments/doctor/:doctorId` → doctor token **403** (admin-scoped read); doctor's own list via `GET /appointments/mine` → **200**. The business rule "doctors see their own workload" is served by `/mine`; cross-doctor/global reads are admin-scoped.

Source: `src/modules/appointments/appointment.routes.ts`, `appointment.service.ts` (`findMyAppointments` scopes by resolved patient/doctor id; `cancelMyAppointment` enforces `patientId`/`slot.doctorId` ownership), `appointment.controller.ts`.

**Verdict: VERIFIED.**

---

## 6. Refresh Rotation Results

Flow: register fresh user → login → tokens `(A1, R1)` → `POST /auth/refresh` with `R1`.

| Check | Expected | Actual | Result |
|---|---|---|---|
| Login returns access+refresh pair | 200, both non-empty | **200**, `accessToken`(208–211 chars) + `refreshToken`(248 chars) | PASS |
| Refresh with R1 returns a new pair | 200, new tokens | **200**; `R2 != R1` (**YES**); `A2` identical only because both signed in the same `iat` second (verified: `A2==A1 → True` is same-second signing, not reuse) | PASS |
| Old token R1 revoked after rotation | revoked server-side | R1 reuse → **401** (see §7) | PASS |
| R2 still usable (rotation chain continues) | 200 | **200** | PASS |

Source: `src/modules/auth/auth.service.ts` (`refreshToken` verifies JWT, looks up token **hash**, calls `revokeRefreshToken(tokenHash)`, then issues a new pair and persists the new hash) and `src/modules/auth/auth.repository.ts` (tokens stored as SHA-256 hashes, filtered by `revoked_at IS NULL AND expires_at > NOW()`).

**Verdict: VERIFIED.**

---

## 7. Refresh Replay Results

| Test | Request | Expected | Actual | Result |
|---|---|---|---|---|
| Reuse of rotated token R1 (replay) | `POST /auth/refresh` `{refreshToken: R1}` | 401, no new tokens minted | **401** "Refresh token not found or expired" | PASS |
| Invalid / garbage token | `{refreshToken:"garbage.invalid.token"}` | 401 | **401** "Invalid refresh token" | PASS |
| Malformed body (missing field) | `{}` | 400 | **400** | PASS |
| Expired token (minted with `exp` = now − 1h using the real `JWT_REFRESH_SECRET`) | expired RT | 401 | **401** "Refresh token not found or expired" | PASS |
| **Concurrent reuse** of the same R1 (2 parallel refreshes) | two parallel requests | at most one succeeds | **200 + 401** (one mints, the other is rejected — token is single-use) | PASS |

Replay can never mint another valid session: a used token's hash is revoked before any new token is issued, so the second use fails the `revoked_at IS NULL` predicate.

Source: `src/modules/auth/auth.repository.ts` `revokeRefreshToken`/`findRefreshToken`.

**Verdict: VERIFIED.**

---

## 8. Upload Security Results

Endpoint: `POST /api/v1/users/avatar` (authenticated). Upload middleware: `src/shared/middlewares/upload.middleware.ts` (multer `memoryStorage`, MIME allow-list `image/jpeg|png|webp`, `fileSize` 2 MB → 413). Persistence: `src/services/avatar-storage.service.ts` re-decodes every buffer through `sharp` → resize 400×400 → re-encode `.webp` with a random UUID filename. Content cannot persist verbatim.

Fixtures were generated locally and uploaded via multipart with explicit `type=` fields.

| File | Claimed MIME | Expected | Actual | Result |
|---|---|---|---|---|
| Valid PNG (71 B) | `image/png` | 200 | **200**, avatar stored as `.webp` | PASS |
| Valid JPEG (generated by `sharp`) | `image/jpeg` | 200 | **200**, stored `.webp` | PASS |
| Valid WebP (generated by `sharp`) | `image/webp` | 200 | **200**, stored `.webp` | PASS |
| **SVG** with `<script>` payload | `image/svg+xml` | reject (400) | **400** "Unsupported file type" | PASS |
| **HTML** with `<script>` | `text/html` | reject (400) | **400** "Unsupported file type" | PASS |
| **Plain text** | `text/plain` | reject (400) | **400** "Unsupported file type" | PASS |
| Random 2.5 MB blob renamed `.png` / MIME `image/png` | `image/png` (oversized) | reject (413) | **413** "File is too large. Maximum size is 2MB." | PASS |
| **Spoof**: HTML payload renamed `ok.png`, MIME `image/png` | `image/png` (faked) | reject | **rejected** (500 at `sharp` decode — content cannot be decoded as an image) | PASS\* |
| **Spoof**: SVG payload renamed `ok.png`, MIME `image/png` | `image/png` (faked) | reject | **rejected** (same `sharp` failure) | PASS\* |

\* A degenerate "valid MIME, invalid image payload" yields an HTTP **500** (uncaught `sharp` error path) rather than a clean 400. Security outcome is correct — the payload is **not stored** and never reaches the client — but the status code is suboptimal error-handling (non-blocking finding N1, §12).

**Verdict: VERIFIED** — validation is MIME-driven at the boundary **and** content-driven (`sharp`) before anything is written. A polyglot cannot survive because input is never persisted; only the re-encoded `.webp` is.

---

## 9. Upload Serving Results

Stored avatar URL from a successful upload: `/uploads/avatars/87181a1a-….webp`. Served by `express.static(path.resolve(uploadConfig.dir))` at `/uploads` (`src/app.ts:18-21`).

| Header / behavior | Observed | Assessment |
|---|---|---|
| `HTTP 200` | yes | PASS |
| `Content-Type` | `image/webp` | PASS |
| `Cache-Control` | `public, max-age=604800` | PASS |
| `ETag` / `Last-Modified` / `Accept-Ranges` | present | PASS |
| `X-Content-Type-Options: nosniff` | **not present on the static 200** (present on error responses) | Non-blocking finding N2 (§12) |
| Serve as executable content | body is `RIFF…WEBPVP8…` (re-encoded WebP 400×400), verified `file` → "Web/P image" | PASS |
| Content negotiation trick | `Accept: text/html` → still `Content-Type: image/webp`, body unchanged WebP | PASS |

File type mismatch (e.g. an HTML payload) can never reach the client as HTML here because (a) the middleware rejects non-image MIME, (b) `sharp` refuses non-decodable content, and (c) stored files are always freshly-re-encoded `.webp` under a random UUID. The absence of `nosniff` is defense-in-depth hygiene only.

**Verdict: VERIFIED** (with non-blocking finding N2).

---

## 10. CORS Results

Config: `src/app.ts:11-16` — `CORS_ORIGINS` env split on commas; not set in `.env`, so runtime allow-list = `["http://localhost:3000"]`; `cors({ origin: allowedOrigins, credentials: true })`.

| Origin | `GET /api/v1/clinics` | `Access-Control-Allow-Origin` echoed? | Browser outcome | Result |
|---|---|---|---|---|
| `http://localhost:3000` (trusted) | 200 | **yes** | allowed | PASS |
| `http://localhost:3141` (untrusted port) | 200 | **no** | blocked by browser | PASS |
| `http://evil.com` | 200 | **no** | blocked by browser | PASS |
| `null` | 200 | **no** | blocked by browser | PASS |

Preflight (`OPTIONS` with `Authorization` + `Content-Type`):

| Origin | Allow-Origin echoed? | Allow-Credentials | Allow-Methods/Headers | Result |
|---|---|---|---|---|
| `http://localhost:3000` | **yes** | `true` | `GET,HEAD,PUT,PATCH,POST,DELETE` + `authorization,content-type` | PASS |
| `http://evil.com` | **no** | `true`\* | set | PASS (blocked) |

\* `Access-Control-Allow-Credentials: true` is emitted even for denied origins, but without a matching `Access-Control-Allow-Origin` the browser refuses the response — this is the standard safe `cors`-package pattern, not a wildcard-vs-credentials conflict.

Note: the **default** allow-list when `CORS_ORIGINS` is unset is `http://localhost:3000`. In production, `CORS_ORIGINS` must be explicitly set to the deployed frontend origin; otherwise the allow-list is the dev default (deployment configuration awarenes — non-blocking finding N3).

**Verdict: VERIFIED** (with deployment note N3).

---

## 11. Existing Automated Test Results

| Check | Command | Result |
|---|---|---|
| Backend typecheck | `npx tsc --noEmit` | **exit 0**, no errors |
| Production build | `npm run build` (`tsc && node scripts/copy-migrations.mjs`) | **exit 0**, migrations copied to `dist/` |
| DB validation harness | `db:test` SQL (`src/database/tests/database_validation.sql`) via `docker exec` | **aborts with ROLLBACK**: `specialties_name_unique` duplicate `("Cardiology")` — the existing test database already contains seeded/prior-test data. The happy-path transaction cannot run in a pre-populated DB. Individual constraint checks that do run report `passed`. |

The DB harness failure is a **pre-existing fixture collision**, not a security regression: the script is transactional and rolls back safely; it was written to run against an empty database. Not a blocker, but the harness is not currently runnable against this populated dev DB without a fresh/empty database or fixture cleanup.

---

## 12. Findings

### Verified — no findings
- **Admin authorization** (A), **appointment ownership** (B), **refresh rotation** (C), **refresh replay detection** (D), **upload validation** (E), **upload serving** (F), **CORS** (G) — all confirmed with live requests (§4–§10).

### Non-blocking findings (do not block the current scope)

| ID | Severity | Finding | Evidence | Why non-blocking |
|---|---|---|---|---|
| **N1** | LOW | Upload of a MIME-valid but image-invalid payload yields HTTP **500** (uncaught `sharp` error) instead of a clean 4xx validation error. | Spoof tests (§8) → 500 on HTML/SVG-as-PNG. `upload.middleware.ts` catches `AppError`/`MulterError` but not decode errors from `avatar-storage.service.ts`. | The malicious payload is still **not stored** and never served; only the status classification is wrong. Backend will not serve stored malicious content. |
| **N2** | LOW | `X-Content-Type-Options: nosniff` is **absent** on `/uploads` static 200 responses (`express.static`); it is present on error responses. | §9 headers. | Stored files are always server-reencoded `.webp` with correct `Content-Type`; browsers receive genuine image bytes. `nosniff` at the upload origin is defense-in-depth. |
| **N3** | INFO | CORS allow-list default is the dev origin when `CORS_ORIGINS` is unset; prod must set it explicitly. | `src/config/env.ts` (optional), `src/app.ts:11`. | Dev default is only `http://localhost:3000`; no wildcard. Purely a deployment configuration check. |
| **N4** | LOW | Admin GET `/admin/users` response exposes user records (existing seeded behavior); also `X-Powered-By: Express` present on backend responses. | §4, §9 headers. | Authorization on these routes is verified; the header is a minor banner disclosure. Neither blocks current scope. |
| **N5** | INFO | `db:test` harness cannot run against the populated dev DB (seeded data collision). | §11. | Test fixture issue, transactional and safe; not a security defect. |

---

## 13. Risk Classification

| Component | Classification | Evidence |
|---|---|---|
| A. Admin authorization | **VERIFIED** | 401/403/200 matrix across patient/doctor/admin/none (§4) |
| B. Appointment ownership | **VERIFIED** | `/mine` scoping + 403 cross-patient cancel + admin-only `/:id` (§5) |
| C. Refresh rotation | **VERIFIED** | R1→R2 rotation, old token revoked (§6) |
| D. Refresh replay detection | **VERIFIED** | replay → 401; concurrent → 200+401 (§7) |
| E. Upload validation | **VERIFIED** | MIME allow-list + size limit + `sharp` content re-encode; SVG/HTML/plain/oversize/spoof rejected (§8) |
| F. Upload serving headers | **VERIFIED** | re-encoded WebP, correct Content-Type, not content-negotiable (§9) |
| G. CORS | **VERIFIED** | trusted-only ACAO; foreign/null origins blocked (§10) |

**Security blockers: NONE.**

---

## 14. Recommended Next Engineering Step

The F-5 dependency is now runtime-verified. The engineering downstream is **optional hardening**, not a required fix:

1. **P1 (recommended soon)** — Return a clean 4xx (400/415) from the avatar endpoint when `sharp` cannot decode a payload, by wrapping `saveAvatar`/`sharp(...).toFile(...)` in a try/catch that maps decode failures to a validation `AppError` (fixes N1, improves API correctness).
2. **P2 (backlog)** — Add `X-Content-Type-Options: nosniff` (and optionally `Content-Disposition: inline` for `/uploads`) at the Express app level so static upload responses carry it too (N2).
3. **P2 (deployment)** — Ensure `CORS_ORIGINS` is set to the production frontend origin in Render/Vercel env config; confirm in a staging pass before go-live (N3).
4. **P2 (process)** — Either run the `db:test` harness against a fresh/empty database in CI or update its fixtures to tolerate existing seed data (N5).
5. **P3 (banner hygiene)** — Optionally remove `X-Powered-By: Express` via `app.disable("x-powered-by")` (N4).

No changes to authorization, token, upload, or CORS logic are warranted by runtime evidence.

---

## Files inspected

- `src/app.ts` (app assembly, CORS, static `/uploads`)
- `src/config/{env,upload,jwt,index,server,database}.ts`
- `src/server.ts` (entry point)
- `src/routes/index.ts` (route table)
- `src/shared/middlewares/{auth,upload,error,validation}.middleware.ts`
- `src/shared/constants/permissions.ts` + `http-status.ts`
- `src/shared/errors/app-error.ts`
- `src/modules/auth/{auth.service,auth.repository,auth.controller,auth.routes,auth.validation,auth.types}.ts`
- `src/modules/appointments/{appointment.service,routes,controller,repository}.ts`
- `src/modules/clinics/clinic.routes.ts`, `src/modules/specialties/specialty.routes.ts`, `src/modules/doctors/doctor.routes.ts`, `src/modules/patients/patient.routes.ts`, `src/modules/payments/payment.routes.ts`, `src/modules/reviews/review.routes.ts`, `src/modules/appointment-slots/appointment-slot.routes.ts`, `src/modules/doctor-schedules/doctor-schedule.routes.ts`, `src/modules/users/users.routes.ts`
- `src/services/avatar-storage.service.ts`
- `src/database/tests/{database_validation,cleanup}.sql`
- `frontend/audit/helpers.ts` (existing test identities)
- `package.json`, `.env`, `.env.example`

## Commands / tests executed

- `node_modules/.bin/tsx src/server.ts` (live backend on `:3001`)
- `curl /health`, `curl POST /auth/login|register|refresh`, `curl /admin/users` (GET/POST/PATCH/DELETE), `curl /appointments/*`, `curl /doctor-schedules/me`, `curl /users/avatar` (multipart), `curl -I|curl -D -` for headers/CORS
- `npx tsc --noEmit` → 0
- `npm run build` → 0
- DB validation SQL via `docker exec` (fixture collision documented)

## Cleanup performed

- Removed 5 temporary users (`secverify%@test.com`), 1 test slot, 2 test appointments (SQL transaction, deletion verified = 0 rows).
- Deleted uploaded test avatar files; reset `audit_admin@test.com` avatar_url → NULL.
- Removed all temp fixtures from `/tmp/opencode`.
- Stopped the backend.
- `git status --short` shows only the pre-existing frontend working-tree changes; **no backend source/config/package file modified**; nothing committed.