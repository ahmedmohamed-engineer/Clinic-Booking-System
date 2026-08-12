# Clinic Booking System — Backend API

A production-grade RESTful API backend for managing clinic appointments, doctor schedules, patient registrations, payments, and reviews. Built with Node.js, Express 5, PostgreSQL, and TypeScript, following a modular layered architecture with role-based access control and refresh token rotation.

The frontend application is documented in [`frontend/README.md`](frontend/README.md). This README covers only the backend.

---

## Live Demo

- **Frontend (MediCare):** https://clinic-booking-system-two.vercel.app
- **Backend API (Railway):** https://clinic-booking-system-production-2a48.up.railway.app — `GET /health` and `GET /api/v1/*` endpoints (verified responding at the time of writing).

See the [Deployment](#deployment) section for platform details.

---

## Features

- **Patient Registration & Authentication** — Email/password registration with bcrypt password hashing, JWT access tokens, and refresh token rotation.
- **Role-Based Access Control (RBAC)** — Three roles (`patient`, `doctor`, `admin`) with granular permission sets.
- **Doctor & Clinic Management** — Full CRUD for doctors, clinics, and medical specialties with public read endpoints.
- **Weekly Schedule Templates** — Define recurring weekly schedules per doctor with configurable slot durations (doctor self-service and admin-managed).
- **Appointment Slot Management** — Individual bookable time slots with status tracking (`available`, `booked`, `cancelled`) and overlap prevention.
- **Appointment Booking** — Patients can book, view, and cancel their own appointments. Doctors can manage appointments assigned to them.
- **Payment Records** — Record payments per appointment (manual record-keeping — no payment gateway integration) with multiple methods and statuses.
- **Reviews & Ratings** — Patients can review completed appointments (ratings 1–5).
- **Avatar Uploads** — Profile photo uploads (`POST /api/v1/users/avatar`) with multer, MIME/type-size enforcement, and Sharp-based image processing.
- **Soft Delete** — Users and appointment slots support soft deletion with partial indexes.
- **Refresh Token Rotation** — Each refresh token is single-use; a new one is issued on every refresh.
- **Input Validation** — Zod schemas validate all request bodies with detailed error responses.
- **Transaction Support** — Multi-table operations are wrapped in database transactions.
- **Raw SQL Migrations** — File-based versioned migrations with an automatic tracking table.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 22 |
| **Language** | TypeScript 7 (strict mode, target per `tsconfig.json`) |
| **Framework** | Express 5 |
| **Database** | PostgreSQL 17 (used by the dev container and local testing) |
| **Database Driver** | `pg` 8 |
| **Validation** | Zod 4 |
| **Authentication** | `jsonwebtoken` 9 + `bcrypt` 6 |
| **File Uploads** | `multer` 2 (memory storage) + `sharp` 0.35 |
| **Dev Runner** | `tsx` (TypeScript execute) |
| **Package Manager** | npm |

---

> **Note:** runtime and language versions are the ones installed in `package.json` / the dev container at the time of writing. Re-verify with `node --version`, `npx tsc --version`.

---

## Architecture

The system follows a **modular layered architecture** within Express. Each domain feature is a self-contained module with its own controller, service, repository, routes, validation schemas, types, and interfaces. Layers are strict — controllers only call services, services only call repositories, and repositories execute raw SQL against PostgreSQL.

```
Client
  │
  ▼
Express App (app.ts)
  │  express.json()
  │  cors() — configured from CORS_ORIGINS
  │  GET /health — liveness probe
  │  /uploads — static files (avatar uploads)
  │  /api/v1
  │
  ▼
Routes (routes/index.ts)
  │  Mounts module routers (public + /admin/*)
  │
  ▼
Middlewares
  │  authenticate()   — JWT verification
  │  authorize()      — Role-permission check
  │  validate()       — Zod body validation
  │
  ▼
Controller
  │  BaseController helpers: ok(), created(), noContent(), paginated()
  │  try/catch → next(error)
  │
  ▼
Service
  │  Business logic, orchestration, AppError throw
  │
  ▼
Repository
  │  Raw SQL via pg Pool, BaseRepository transaction support
  │
  ▼
PostgreSQL
```

### Layer Responsibilities

| Layer | Role |
|-------|------|
| **Routes** | Define HTTP methods, paths, middleware chains, and controller bindings |
| **Middleware** | Authentication, authorization, validation, error handling |
| **Controller** | Parse request, call service, format response via `BaseController` |
| **Service** | Implement business rules, coordinate multiple repository calls |
| **Repository** | Execute parameterized SQL queries, manage transactions |
| **Database** | PostgreSQL with enums, constraints, indexes, and soft delete |

### Shared Cross-Cutting Layer

- `AppError` — Custom error class with HTTP status codes and operational/non-operational distinction
- `ApiResponse` — Unified response builder (`{ success, data, message, pagination, errors }`)
- `BaseRepository` — Transaction management (`transaction()`, `beginTransaction()`, `commit()`, `rollback()`)
- `BaseController` — Response helper methods (`ok`, `created`, `noContent`, `paginated`)
- `errorMiddleware` — Global handler for operational `AppError`s, PostgreSQL errors, and unexpected errors

---

## Folder Structure

```
src/
├── app.ts                      # Express app setup (JSON parser, routes, error handler)
├── server.ts                   # Entry point — connect DB, run migrations, listen
├── config/
│   ├── env.ts                  # Zod-validated environment variables
│   ├── database.ts             # Database connection config
│   ├── jwt.ts                  # JWT secret and expiry config
│   ├── server.ts               # Server port and environment config
│   └── index.ts                # Re-exports
├── services/
│   ├── database.service.ts     # pg Pool singleton + connectDatabase()
│   ├── migration.service.ts    # SQL file-based migration runner
│   └── avatar-storage.service.ts # Sharp-based avatar resize/optimization
├── routes/
│   └── index.ts                # Central router mounting all modules
├── shared/
│   ├── constants/
│   │   ├── http-status.ts      # HTTP status code map
│   │   ├── permissions.ts      # Permission strings + RolePermissions RBAC map
│   │   ├── messages.ts         # Error message templates
│   │   └── pagination.ts       # Pagination defaults
│   ├── controllers/
│   │   └── base.controller.ts  # Response helpers
│   ├── errors/
│   │   └── app-error.ts        # Custom error class
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # authenticate() + authorize()
│   │   ├── validation.middleware.ts # Zod validate()
│   │   ├── upload.middleware.ts     # multer avatar upload + MIME/size checks
│   │   └── error.middleware.ts      # Global error handler
│   ├── repositories/
│   │   └── base.repository.ts  # Transaction and query base class
│   ├── services/
│   │   └── api-response.service.ts # Unified JSON response builder
│   ├── types/
│   │   ├── api-response.types.ts
│   │   ├── common.types.ts
│   │   ├── express.d.ts        # Request.user augmentation
│   │   ├── pagination.types.ts
│   │   └── user.types.ts
│   └── utils/
│       └── password.ts         # bcrypt hash/compare
├── database/
│   ├── migrations/             # Versioned SQL migrations (001–008)
│   └── tests/                  # SQL validation scripts
└── modules/                    # Feature modules
    ├── auth/
    ├── users/                  # Admin CRUD + self avatar upload
    ├── patients/
    ├── doctors/
    ├── clinics/
    ├── specialties/
    ├── doctor-schedules/
    ├── appointment-slots/
    ├── appointments/
    ├── payments/
    └── reviews/
```

**Note:** a `notifications` table exists in the database schema, but no notifications API module is implemented.

Each module follows the same file convention (8 files):
- `{module}.controller.ts`
- `{module}.service.ts`
- `{module}.repository.ts`
- `{module}.routes.ts`
- `{module}.validation.ts`
- `{module}.types.ts`
- `{module}.interfaces.ts`
- `index.ts`

---

## Database Design

### Enums

| Type | Values |
|------|--------|
| `user_role` | `patient`, `doctor`, `admin` |
| `slot_status` | `available`, `booked`, `cancelled` |
| `appointment_status` | `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `payment_method` | `cash`, `card`, `bank_transfer`, `online` |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |

### Tables and Relationships

```
users (1) ──── (1) patients ──── (*) appointments ──── (1) payments
  │                                │
  │                                └── (1) reviews
  │
  ├── (*) doctors ──── (*) doctor_schedules ──── (*) appointment_slots
  │     │                └── appointment_slots via FK
  │     │
  │     ├── (*) clinics
  │     └── (*) specialties
  │
  ├── (*) notifications
  │
  └── (*) refresh_tokens
```

**Key constraints:**
- `patients.user_id` — UNIQUE (one patient record per user)
- `doctors.user_id` — UNIQUE (one doctor profile per user)
- `appointments.slot_id` — partial UNIQUE index `WHERE status IN ('scheduled', 'confirmed')` (one active appointment per slot; a slot can be rebooked after its appointment is cancelled/completed)
- `payments.appointment_id` — UNIQUE (one payment per appointment)
- `reviews.appointment_id` — UNIQUE (one review per appointment)
- `doctor_schedules(doctor_id, weekday, start_time)` — UNIQUE (no overlapping schedule entries)
- `appointment_slots(doctor_id, slot_date, start_time)` — UNIQUE (no duplicate slots)
- `end_time > start_time` — CHECK on `doctor_schedules` and `appointment_slots`
- `slot_duration > 0` — CHECK on `doctor_schedules`

### Soft Delete Strategy

Only two tables use soft delete via a nullable `deleted_at` column:

| Table | Partial Index |
|-------|---------------|
| `users` | `WHERE deleted_at IS NOT NULL` |
| `appointment_slots` | `WHERE deleted_at IS NOT NULL` |

All other tables use hard deletes. Foreign key actions (`ON DELETE CASCADE` / `ON DELETE RESTRICT`) enforce referential integrity.

### Foreign Key Delete Actions

| Source | Target | On Delete |
|--------|--------|-----------|
| `patients`, `doctors`, `notifications`, `refresh_tokens` | `users(id)` | CASCADE |
| `doctors` | `clinics(id)` | RESTRICT |
| `doctors` | `specialties(id)` | RESTRICT |
| `doctor_schedules`, `appointment_slots` | `doctors(id)` | CASCADE |
| `appointment_slots` | `doctor_schedules(id)` | CASCADE |
| `appointments` | `patients(id)` | RESTRICT |
| `appointments` | `appointment_slots(id)` | RESTRICT |
| `payments` | `appointments(id)` | RESTRICT |
| `reviews` | `appointments(id)` | CASCADE |

---

## Authentication

### JWT-Based Authentication

The system uses short-lived JWT access tokens (default 15 minutes) and long-lived refresh tokens (default 7 days).

- **Access Token** — Signed with `JWT_SECRET`, contains `{ sub: userId, role: UserRole }`. Used for API authorization.
- **Refresh Token** — Signed with `JWT_REFRESH_SECRET`, contains `{ sub: userId, jti: uuid }`. Used to obtain new access tokens.

### Registration Flow

1. Client sends `POST /api/v1/auth/register` with `{ email, password, fullName }`
2. Server validates uniqueness of email
3. Password is hashed with bcrypt (12 salt rounds)
4. **Transaction**: creates `users` row (role=`patient`) + `patients` row with `fullName`
5. Access + refresh tokens are generated
6. Refresh token is SHA-256 hashed and stored in `refresh_tokens` table
7. Both tokens are returned to client

### Login Flow

1. Client sends `POST /api/v1/auth/login` with `{ email, password }`
2. Server looks up user by email (excluding soft-deleted)
3. Password hash is compared with bcrypt
4. Tokens generated and refresh token persisted
5. Both tokens returned to client

### Refresh Token Rotation

1. Client sends `POST /api/v1/auth/refresh` with `{ refreshToken }`
2. Server verifies the JWT signature against `JWT_REFRESH_SECRET`
3. SHA-256 hash of the token is looked up in `refresh_tokens` (must be unrevoked and not expired)
4. User existence is confirmed
5. Old refresh token is revoked (`revoked_at = NOW()`)
6. New token pair is generated and the new refresh token is persisted
7. New tokens returned to client

The old token is **permanently invalidated** after a successful refresh. This prevents replay attacks.

### Logout

1. Client sends `POST /api/v1/auth/logout` with `{ refreshToken }` (requires authentication)
2. Server hashes the token and sets `revoked_at = NOW()` on the matching row
3. Response: **204 No Content**

### Token Validation

The `authenticate` middleware:
1. Extracts the `Authorization: Bearer <token>` header
2. Verifies the access token against `JWT_SECRET`
3. Attaches `req.user = { sub: userId, role }` to the request
4. Throws **401** on missing header, invalid format, or invalid/expired token

---

## Authorization

### Roles & Permissions

The system implements **resource-based permissions** mapped to roles.

| Role | Permissions |
|------|-------------|
| **admin** | All `MANAGE_*` permissions (11 permissions covering users, patients, doctors, clinics, specialties, schedules, slots, appointments, payments, reviews, notifications) |
| **doctor** | `VIEW_OWN_PROFILE`, `MANAGE_OWN_PROFILE`, `VIEW_OWN_SCHEDULE`, `MANAGE_OWN_SCHEDULE`, `MANAGE_OWN_APPOINTMENTS`, `VIEW_OWN_REVIEWS`, `MANAGE_OWN_NOTIFICATIONS` |
| **patient** | `VIEW_OWN_PROFILE`, `MANAGE_OWN_PROFILE`, `BOOK_APPOINTMENT`, `MANAGE_OWN_APPOINTMENTS`, `PAY_APPOINTMENT`, `MANAGE_OWN_REVIEWS`, `MANAGE_OWN_NOTIFICATIONS` |

### Permission Enforcement

The `authorize(...permissions)` middleware checks if the authenticated user's role has **any** of the specified permissions (OR logic):

```typescript
// Example: route requires MANAGE_USERS permission
router.get("/", authenticate, authorize(Permissions.MANAGE_USERS), controller.findAll);
```

### Route Categories

| Category | Access |
|----------|--------|
| **Public** | No authentication — read-only access to doctors, clinics, specialties, and available slots |
| **Self-Service** | Authenticated users — patients/doctors access their own data only (e.g., `/me` endpoints) |
| **Admin** | Authenticated + `MANAGE_*` permission — full CRUD on all resources |

### Ownership Enforcement (Service Layer)

Beyond middleware-level authorization, services enforce data ownership:
- Patients can only view/edit their own patient profile, appointments, payments, and reviews
- Doctors can only view their own schedule and appointments assigned to their slots
- Past appointments cannot be cancelled by patients

---

## Modules

### Auth

**Purpose:** User registration, login, token management, and current user retrieval.

**Business Rules:**
- Registration always creates role `patient` and a corresponding patient profile (in a transaction)
- Email must be unique (soft-deleted emails can be reused — query excludes `deleted_at IS NOT NULL`)
- Password: 8–128 characters, bcrypt hashed with 12 salt rounds
- Refresh tokens are single-use (rotated on each refresh)

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | No | Register new patient |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | Yes | Revoke refresh token |
| GET | `/auth/me` | Yes | Get current user profile |

---

### Users (Admin CRUD + Self Avatar)

**Purpose:** Admin CRUD for user accounts with soft delete support; authenticated users can upload their profile avatar.

**Business Rules:**
- Only admins with `MANAGE_USERS` permission can access the CRUD endpoints
- Email uniqueness check excludes the current user on update
- Cannot update or delete a soft-deleted user
- Soft delete sets `deleted_at` and `updated_at` to `NOW()`
- `POST /users/avatar` is available to any authenticated role; multipart `avatar` field, JPEG/PNG/WebP under 2 MB; the resized/optimized image is served from `/uploads` (static, 7-day cache)

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/admin/users` | Yes | `MANAGE_USERS` |
| GET | `/admin/users/:id` | Yes | `MANAGE_USERS` |
| PATCH | `/admin/users/:id` | Yes | `MANAGE_USERS` |
| DELETE | `/admin/users/:id` | Yes | `MANAGE_USERS` |
| POST | `/users/avatar` | Yes | Any authenticated role |

---

### Patients

**Purpose:** Manage patient profiles. Self-service for own profile, admin CRUD for all.

**Business Rules:**
- One patient record per user (UNIQUE `user_id` constraint)
- Patients can view and edit their own profile via `/patients/me`
- Admin can view, create, update, delete any patient

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/patients/me` | Yes | `VIEW_OWN_PROFILE` |
| PATCH | `/patients/me` | Yes | `MANAGE_OWN_PROFILE` |
| POST | `/patients` | Yes | `MANAGE_PATIENTS` |
| GET | `/patients` | Yes | `MANAGE_PATIENTS` |
| GET | `/patients/:id` | Yes | `MANAGE_PATIENTS` |
| GET | `/patients/user/:userId` | Yes | `MANAGE_PATIENTS` |
| PATCH | `/patients/:id` | Yes | `MANAGE_PATIENTS` |
| DELETE | `/patients/:id` | Yes | `MANAGE_PATIENTS` |

---

### Doctors

**Purpose:** Manage doctor profiles. Public read, admin CRUD, and doctor self-service.

**Business Rules:**
- Doctor creation requires an existing user with role `doctor`
- Clinic and specialty must exist
- One doctor per user (UNIQUE `user_id` constraint)
- Public list/detail endpoints are unauthenticated
- Doctors can view and edit their own profile via `/doctors/me`
- `consultation_fee >= 0`, `experience_years >= 0`
- Hard delete

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/doctors` | No | — |
| GET | `/doctors/:id` | No | — |
| GET | `/doctors/me` | Yes | `VIEW_OWN_PROFILE` |
| PATCH | `/doctors/me` | Yes | `MANAGE_OWN_PROFILE` |
| GET | `/admin/doctors` | Yes | `MANAGE_DOCTORS` |
| GET | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` |
| POST | `/admin/doctors` | Yes | `MANAGE_DOCTORS` |
| PATCH | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` |
| DELETE | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` |

---

### Clinics

**Purpose:** Manage clinic locations. Public read, admin CRUD.

**Business Rules:**
- Public read access is unauthenticated
- Clinics with doctors cannot be deleted (DB: `ON DELETE RESTRICT`)
- Hard delete

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/clinics` | No | — |
| GET | `/clinics/:id` | No | — |
| GET | `/admin/clinics` | Yes | `MANAGE_CLINICS` |
| GET | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` |
| POST | `/admin/clinics` | Yes | `MANAGE_CLINICS` |
| PATCH | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` |
| DELETE | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` |

---

### Specialties

**Purpose:** Manage medical specialties. Public read, admin CRUD.

**Business Rules:**
- Name is unique
- Specialties used by doctors cannot be deleted (DB: `ON DELETE RESTRICT`)
- Hard delete

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/specialties` | No | — |
| GET | `/specialties/:id` | No | — |
| GET | `/admin/specialties` | Yes | `MANAGE_SPECIALTIES` |
| GET | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` |
| POST | `/admin/specialties` | Yes | `MANAGE_SPECIALTIES` |
| PATCH | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` |
| DELETE | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` |

---

### Doctor Schedules

**Purpose:** Define weekly schedule templates for doctors (recurring time blocks).

**Business Rules:**
- `weekday` 0–6 (Sunday–Saturday)
- `endTime > startTime`
- `slotDuration > 0` (minutes)
- Unique per doctor + weekday + start_time
- Doctors can view their own schedule via `/doctor-schedules/me`
- Hard delete

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/doctor-schedules/me` | Yes | `VIEW_OWN_SCHEDULE` |
| POST | `/doctor-schedules/me` | Yes | `MANAGE_OWN_SCHEDULE` |
| PATCH | `/doctor-schedules/me/:id` | Yes | `MANAGE_OWN_SCHEDULE` |
| DELETE | `/doctor-schedules/me/:id` | Yes | `MANAGE_OWN_SCHEDULE` |
| GET | `/admin/doctor-schedules` | Yes | `MANAGE_SCHEDULES` |
| GET | `/admin/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` |
| GET | `/admin/doctor-schedules/doctor/:doctorId` | Yes | `MANAGE_SCHEDULES` |
| POST | `/admin/doctor-schedules` | Yes | `MANAGE_SCHEDULES` |
| PATCH | `/admin/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` |
| DELETE | `/admin/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` |

---

### Appointment Slots

**Purpose:** Individual bookable time slots derived from doctor schedules.

**Business Rules:**
- `endTime > startTime`
- Status: `available`, `booked`, `cancelled` (default `available`)
- Unique per doctor + slot_date + start_time
- No overlapping time ranges allowed
- Public read (available slots, by doctor, by date) is unauthenticated
- Soft delete with partial index on `deleted_at`

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| GET | `/appointment-slots/available` | No | — |
| GET | `/appointment-slots/doctor/:doctorId` | No | — |
| GET | `/appointment-slots/date/:slotDate` | No | — |
| GET | `/admin/appointment-slots` | Yes | `MANAGE_SLOTS` |
| GET | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` |
| GET | `/admin/appointment-slots/available` | Yes | `MANAGE_SLOTS` |
| GET | `/admin/appointment-slots/doctor/:doctorId` | Yes | `MANAGE_SLOTS` |
| GET | `/admin/appointment-slots/date/:slotDate` | Yes | `MANAGE_SLOTS` |
| POST | `/admin/appointment-slots` | Yes | `MANAGE_SLOTS` |
| PATCH | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` |
| DELETE | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` |

---

### Appointments

**Purpose:** Book, manage, and track appointments between patients and doctors.

**Business Rules:**
- Slot must exist, not soft-deleted, and status must be `available`
- Each slot can have at most one appointment (UNIQUE constraint)
- **Transaction**: Create appointment + Set slot to `booked`
- Patients can only cancel their own appointments
- Doctors can only cancel appointments assigned to their slots
- Only `scheduled` or `confirmed` appointments can be cancelled
- `PATCH /appointments/mine/:id` lets a patient or doctor cancel their own appointment (ownership is enforced in the service layer)
- Appointments that have a linked payment cannot be deleted (conflict error)
- Past appointments cannot be cancelled by patients
- Status transitions update slot status accordingly (cancelled → available, restored → booked)
- Delete releases the slot back to `available`

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| POST | `/appointments` | Yes | `BOOK_APPOINTMENT` / `MANAGE_OWN_APPOINTMENTS` |
| GET | `/appointments/mine` | Yes | `MANAGE_OWN_APPOINTMENTS` |
| PATCH | `/appointments/mine/:id` | Yes | `MANAGE_OWN_APPOINTMENTS` |
| GET | `/appointments` | Yes | `MANAGE_APPOINTMENTS` |
| GET | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` |
| GET | `/appointments/patient/:patientId` | Yes | `MANAGE_APPOINTMENTS` |
| GET | `/appointments/doctor/:doctorId` | Yes | `MANAGE_APPOINTMENTS` |
| PATCH | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` |
| DELETE | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` |

---

### Payments

**Purpose:** Record payments for appointments.

**Business Rules:**
- One payment per appointment (UNIQUE)
- Amount must be > 0
- Methods: `cash`, `card`, `bank_transfer`, `online`
- Statuses: `pending`, `paid`, `failed`, `refunded` (default `pending`)
- Patients can only pay for their own appointments
- Cannot pay for cancelled or completed appointments
- `transaction_reference` is unique

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| POST | `/payments` | Yes | `PAY_APPOINTMENT` / `MANAGE_PAYMENTS` |
| GET | `/payments/mine` | Yes | `PAY_APPOINTMENT` |
| PATCH | `/payments/mine/:id` | Yes | `PAY_APPOINTMENT` |
| GET | `/payments` | Yes | `MANAGE_PAYMENTS` |
| GET | `/payments/:id` | Yes | `MANAGE_PAYMENTS` |
| GET | `/payments/appointment/:appointmentId` | Yes | `MANAGE_PAYMENTS` |
| PATCH | `/payments/:id` | Yes | `MANAGE_PAYMENTS` |
| DELETE | `/payments/:id` | Yes | `MANAGE_PAYMENTS` |

---

### Reviews

**Purpose:** Allow patients to rate and review completed appointments.

**Business Rules:**
- One review per appointment (UNIQUE on `appointment_id`)
- Rating 1–5
- Comment max 500 characters
- Only the patient who owns the completed appointment can review it
- Patients can view their own reviews

**Endpoints:**
| Method | Route | Auth | Permission |
|--------|-------|------|------------|
| POST | `/reviews` | Yes | `MANAGE_OWN_REVIEWS` |
| GET | `/reviews/mine` | Yes | `MANAGE_OWN_REVIEWS` / `VIEW_OWN_REVIEWS` |
| GET | `/reviews` | Yes | `MANAGE_REVIEWS` |
| GET | `/reviews/:id` | Yes | `MANAGE_REVIEWS` |
| GET | `/reviews/appointment/:appointmentId` | Yes | `MANAGE_REVIEWS` |
| PATCH | `/reviews/:id` | Yes | `MANAGE_REVIEWS` |
| DELETE | `/reviews/:id` | Yes | `MANAGE_REVIEWS` |

---

## API Overview

All endpoints are prefixed with `/api/v1`. `GET /health` (liveness probe) is mounted at the root of the app, outside the API prefix.

| Module | Prefix | Public | Auth | Admin |
|--------|--------|--------|------|-------|
| Health | `/health` | ✓ | — | — |
| Auth | `/auth` | Register, Login, Refresh | Logout, Me | — |
| Users | `/users` | — | Avatar upload | `/admin/users` |
| Patients | `/patients` | — | `/me` | ✓ |
| Doctors | `/doctors` | List, Detail | `/me` | `/admin/doctors` |
| Clinics | `/clinics` | List, Detail | — | `/admin/clinics` |
| Specialties | `/specialties` | List, Detail | — | `/admin/specialties` |
| Doctor Schedules | `/doctor-schedules` | — | `/me` | `/admin/doctor-schedules` |
| Appointment Slots | `/appointment-slots` | Available, By Doctor, By Date | — | `/admin/appointment-slots` |
| Appointments | `/appointments` | — | `/mine`, create | `/admin/appointments` |
| Payments | `/payments` | — | `/mine` | `/admin/payments` |
| Reviews | `/reviews` | — | `/mine` | `/admin/reviews` |

---

## Installation

### Prerequisites

- Node.js 22+
- PostgreSQL 17+
- npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd clinic-booking-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secrets

# Run database migrations (automatic on server start)
npm run dev
```

The server automatically:
1. Connects to PostgreSQL
2. Runs all pending SQL migrations in order
3. Starts listening on the configured port

### Environment Variables

Create a `.env` file in the project root (see `.env.example` for the full list):

```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=clinic_booking
DB_USER=postgres
DB_PASSWORD=postgres

# CORS - comma-separated list of allowed browser origins
CORS_ORIGINS=http://localhost:3000

JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Optional: avatar upload directory (defaults to ./uploads)
# UPLOAD_DIR=uploads
```

Optional bootstrap variables parsed by the environment schema (`SYSTEM_ADMIN_EMAIL`, `SYSTEM_ADMIN_PASSWORD`, `SYSTEM_ADMIN_NAME`) exist in `.env.example`. They are currently **not consumed** by any startup/bootstrap logic — treat them as reserved until the admin seeding feature is implemented. `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters. For production, set secrets on the hosting platform, never commit them.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to JavaScript + copy migration files |
| `npm run start` | Start compiled production server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests (not yet implemented) |

---

## Deployment

The backend does not ship its own Dockerfile, `Procfile`, or `nixpacks` configuration in the repository — deployment is handled by the hosting platform. The known production deployments are:

- **Backend:** REST API deployed on Railway (`clinic-booking-system-production-2a48.up.railway.app`), with the connection string provided via environment variables.
- **Database:** Neon PostgreSQL (connection URL injected through environment variables).
- **Frontend:** Next.js app on Vercel — see [`frontend/README.md`](frontend/README.md).

Build/start in production from the source tree:

```bash
npm install
npm run build   # tsc + copy migrations
npm start       # node dist/server.js
```

On startup the server connects to PostgreSQL, applies pending migrations, and begins listening. `UPLOAD_DIR` defaults to `./uploads` — configure a persistent volume for that path on the host.

---

## Security Features

### Password Hashing
- bcrypt with 12 salt rounds
- Passwords never stored in plaintext

### JWT Authentication
- Access tokens: short-lived (default 15 minutes)
- Refresh tokens: long-lived (default 7 days), with rotation
- Tokens verified against separate secrets

### Refresh Token Rotation
- Each refresh token is single-use
- Old token revoked on each refresh
- Prevents replay attacks if a token is compromised

### Input Validation
- All request bodies validated with Zod schemas
- Strict UUID, email, date, time, and enum validation
- Cross-field validation (e.g., `endTime > startTime`)

### SQL Injection Prevention
- All queries use parameterized prepared statements (`$1`, `$2`, etc.)
- No string concatenation for user input

### Service-Layer Ownership (Access Control)
- Data ownership is enforced **in service code** using the authenticated user id (`req.user.sub`); there are no PostgreSQL RLS policies
- Patients can only access their own appointments, payments, reviews, and patient profile
- Doctors can only access their own profile, schedule, and appointments assigned to their slots

### IDOR Prevention
- Access to resources by ID is gated by authorization middleware AND ownership checks in services
- `/mine` endpoints restrict access to current user's data

### Soft Delete
- Users and appointment slots are soft-deleted (not physically removed)
- Queries exclude soft-deleted records via `WHERE deleted_at IS NULL`
- Soft-deleted records remain for audit purposes

### Transactions
- Multi-table operations wrapped in database transactions
- Automatic rollback on failure
- Prevents partial writes and data inconsistency

### Error Handling
- `AppError` with `isOperational` flag distinguishes expected from unexpected errors
- Operational errors return appropriate HTTP status codes (400, 401, 403, 404, 409, 422)
- Unexpected errors return 500 without leaking details

---

## Error Handling

### Response Format

All API responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ ... ]
}
```

### HTTP Status Codes Used

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (deletion) |
| 400 | Validation failure, bad request |
| 401 | Missing/invalid authentication |
| 403 | Insufficient permissions (authorization) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, slot already booked) |
| 422 | Unprocessable entity |
| 500 | Internal server error |

### Validation Errors

Zod validation failures return a 400 status with detailed error information:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_string",
      "validation": "email",
      "message": "Invalid email",
      "path": ["email"]
    }
  ]
}
```

---

## Testing

The project includes SQL-based database validation scripts:

| Script | Location | Description |
|--------|----------|-------------|
| `database_validation.sql` | `src/database/tests/` | Validates database schema, constraints, and enums |
| `cleanup.sql` | `src/database/tests/` | Cleans up test data |

Run database tests:
```bash
npm run db:test
```

**Note:** Unit tests and integration tests are not yet implemented. The `npm test` script is a placeholder.

---

## Future Improvements

- **Unit and Integration Tests** — Add comprehensive test coverage with Jest or Vitest
- **API Versioning** — Formalize versioning strategy (already structured for `/api/v1`)
- **Passwordless Token Refresh** — Implement refresh token automatic renewal before expiry
- **Slot Auto-Generation** — Automatically generate appointment slots from doctor schedules via a scheduled job
- **Email Notifications** — Implement the notifications API module (the database table already exists)
- **Rate Limiting** — Add rate limiting to authentication endpoints
- **Request Logging** — Add structured logging (pino, winston) for observability
- **Pagination** — Implement pagination filtering and sorting across all list endpoints (infrastructure exists but is partially used)
- **Docker Compose for Production** — Add production-grade Docker Compose configuration
- **CI/CD Pipeline** — Add GitHub Actions for linting, type checking, and testing
- **Swagger/OpenAPI** — Generate API documentation
- **Audit Logging** — Track user actions for compliance
- **Search & Filter** — Add advanced search and filtering capabilities (by date range, status, etc.)
