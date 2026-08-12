# Project Report — Clinic Booking System Backend

> Technical report documenting the design and implementation of the Clinic Booking System backend.

---

## 1. High-Level Overview

The Clinic Booking System is a RESTful API backend that enables patients to register, browse doctors and clinics, book appointments, make payments, and leave reviews. Doctors can manage their schedules and view appointments. Administrators have full CRUD access to all resources.

The system is built with **Node.js**, **Express 5**, and **PostgreSQL**. It uses **TypeScript** for static typing, **Zod** for request validation, **bcrypt** for password hashing, and **jsonwebtoken** for JWT-based authentication with refresh token rotation.

The architecture is **modular layered**: each domain feature (auth, users, patients, doctors, clinics, etc.) is a self-contained module with its own controller, service, repository, routes, validation schemas, types, and interfaces. There is no dependency injection container — modules export singletons that are imported directly.

Database access is through **raw SQL with parameterized queries** via the `pg` library. The `BaseRepository` class provides transaction management (`BEGIN`/`COMMIT`/`ROLLBACK`). SQL migrations are versioned files executed in order.

---

## 2. Architecture Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client (HTTP)                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Express App (app.ts)                                                │
│  ┌─────────────┐  ┌──────────────────────────┐  ┌────────────────┐ │
│  │ express.json()│  │   /api/v1 (routes/index)  │  │ errorMiddleware│ │
│  └─────────────┘  └────────────┬───────────────┘  └────────────────┘ │
└────────────────────────────────┼──────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Route Layer (modules/*/*.routes.ts)                                   │
│                                                                        │
│  Middleware Chain:                                                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ validate()│→│authenticate│→│authorize()│→│ Controller method  │  │
│  │ (Zod)    │  │ (JWT)      │  │ (RBAC)   │  │                    │  │
│  └──────────┘  └────────────┘  └──────────┘  └────────┬───────────┘  │
│                                                       │               │
└───────────────────────────────────────────────────────┼───────────────┘
                                                         │
                                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Controller Layer (*.controller.ts)                                   │
│  - Extends BaseController (ok, created, noContent, paginated)         │
│  - Parses req.params, req.query, req.body, req.user                   │
│  - Calls service method                                               │
│  - Wraps in try/catch → next(error)                                   │
│  - Sends response via ApiResponse helpers                             │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Service Layer (*.service.ts)                                         │
│  - Contains business logic and validation                             │
│  - Orchestrates multiple repository calls                             │
│  - Throws AppError on violations                                      │
│  - Manages transactions via repository.transaction()                  │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Repository Layer (*.repository.ts)                                   │
│  - Extends BaseRepository (pool, client, query, transaction)          │
│  - Executes parameterized SQL queries                                 │
│  - Returns typed records (interfaces)                                 │
│  - Handles transaction lifecycle                                      │
└──────────────────────────┬─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                                  │
│  - 11 tables + 5 enums + 14 indexes + 8 check constraints            │
│  - Soft delete on users and appointment_slots                        │
│  - CASCADE/RESTRICT referential integrity                             │
└────────────────────────────────────────────────────────────────────────┘
```

**Startup Sequence:**
```
server.ts → connectDatabase() → runMigrations() → app.listen()
```

---

## 3. Complete Module Documentation

### 3.1 Auth Module

**Purpose:** Handle user identity — registration, login, token refresh, and logout.

**Flow:**
```
Register:
  POST /auth/register
  → validate(registerSchema)
  → authController.register
  → authService.register
    → Check email uniqueness (authRepository.findByEmail)
    → Hash password (hashPassword, bcrypt 12 rounds)
    → Transaction:
        → authRepository.create (INSERT users, role='patient')
        → authRepository.createPatient (INSERT patients)
    → Generate access + refresh tokens
    → Persist refresh token (authRepository.saveRefreshToken)
  → Return { accessToken, refreshToken } (201)

Login:
  POST /auth/login
  → validate(loginSchema)
  → authController.login
  → authService.login
    → Find user by email (WHERE deleted_at IS NULL)
    → Compare password hash
    → Generate tokens + persist refresh
  → Return { accessToken, refreshToken }

Refresh:
  POST /auth/refresh
  → validate(refreshTokenSchema)
  → authController.refreshToken
  → authService.refreshToken
    → JWT.verify(refreshToken, JWT_REFRESH_SECRET)
    → SHA-256 hash token → lookup in refresh_tokens (WHERE revoked IS NULL AND expires > NOW())
    → Verify user exists
    → Revoke old token
    → Generate new pair + persist new refresh
  → Return { accessToken, refreshToken }

Logout:
  POST /auth/logout
  → authenticate middleware
  → validate(logoutSchema)
  → authController.logout
  → authService.logout
    → Hash token → set revoked_at = NOW()
  → 204 No Content

Me:
  GET /auth/me
  → authenticate middleware
  → authController.me
  → authService.me
    → Find user by ID
  → Return UserPublic
```

**Dependencies:** `authRepository`, `password.ts`, `jsonwebtoken`, `crypto`

**Database Tables:** `users`, `patients`, `refresh_tokens`

**Business Rules:**
- Registration always creates `patient` role
- Email must be unique (case-sensitive)
- Password 8–128 chars, bcrypt 12 rounds
- Soft-deleted users cannot log in
- Refresh tokens are single-use (rotation)

---

### 3.2 Users Module (Admin)

**Purpose:** Admin CRUD for user accounts.

**Flow:**
```
GET /admin/users → authenticate → authorize(MANAGE_USERS) → controller.findAll
GET /admin/users/:id → authenticate → authorize(MANAGE_USERS) → controller.findById
PATCH /admin/users/:id → authenticate → authorize(MANAGE_USERS) → validate → controller.update
DELETE /admin/users/:id → authenticate → authorize(MANAGE_USERS) → controller.delete
```

**Dependencies:** `userRepository`

**Database Tables:** `users`

**Business Rules:**
- Only `MANAGE_USERS` permission (admin role)
- Email uniqueness check excludes current ID on update
- Cannot update/delete soft-deleted users
- Soft delete sets `deleted_at` + `updated_at`

---

### 3.3 Patients Module

**Purpose:** Patient profile management. Self-service and admin.

**Flow:**
```
Self-service:
  GET /patients/me → authenticate → authorize(VIEW_OWN_PROFILE) → controller.findMe
  PATCH /patients/me → authenticate → authorize(MANAGE_OWN_PROFILE) → validate → controller.updateMe

Admin:
  POST /patients → authenticate → authorize(MANAGE_PATIENTS) → validate → controller.create
  GET /patients → authenticate → authorize(MANAGE_PATIENTS) → controller.findAll
  GET /patients/:id → authenticate → authorize(MANAGE_PATIENTS) → controller.findById
  GET /patients/user/:userId → authenticate → authorize(MANAGE_PATIENTS) → controller.findByUserId
  PATCH /patients/:id → authenticate → authorize(MANAGE_PATIENTS) → validate → controller.update
  DELETE /patients/:id → authenticate → authorize(MANAGE_PATIENTS) → controller.delete
```

**Dependencies:** `patientRepository`, user lookup

**Database Tables:** `patients`

**Business Rules:**
- One patient per user (UNIQUE)
- `/me` endpoints scoped to authenticated user
- Admin CRUD requires `MANAGE_PATIENTS`

---

### 3.4 Doctors Module

**Purpose:** Doctor profile management. Public read, admin CRUD.

**Flow:**
```
Public:
  GET /doctors → controller.findAll (no auth)
  GET /doctors/:id → controller.findById (no auth)

Admin:
  GET /admin/doctors → authenticate → authorize(MANAGE_DOCTORS) → controller.findAll
  POST /admin/doctors → authenticate → authorize(MANAGE_DOCTORS) → validate → controller.create
  PATCH /admin/doctors/:id → authenticate → authorize(MANAGE_DOCTORS) → validate → controller.update
  DELETE /admin/doctors/:id → authenticate → authorize(MANAGE_DOCTORS) → controller.delete
```

**Dependencies:** `doctorRepository`, user lookup, clinic lookup, specialty lookup

**Database Tables:** `doctors`, `users`, `clinics`, `specialties`

**Business Rules:**
- User must exist with role `doctor`
- Clinic and specialty must exist
- One doctor per user (UNIQUE)
- `consultation_fee >= 0`, `experience_years >= 0`
- Hard delete

---

### 3.5 Clinics Module

**Purpose:** Clinic location management. Public read, admin CRUD.

**Flow:** Same pattern as doctors — public read routes under `/clinics`, admin CRUD under `/admin/clinics`.

**Dependencies:** `clinicRepository`

**Database Tables:** `clinics`

**Business Rules:**
- Public read unauthenticated
- Clinics with doctors cannot be deleted (DB RESTRICT)
- Hard delete

---

### 3.6 Specialties Module

**Purpose:** Medical specialty management. Public read, admin CRUD.

**Flow:** Same pattern as clinics.

**Dependencies:** `specialtyRepository`

**Database Tables:** `specialties`

**Business Rules:**
- Name is unique
- Specialties used by doctors cannot be deleted (DB RESTRICT)
- Hard delete

---

### 3.7 Doctor Schedules Module

**Purpose:** Weekly schedule templates for doctors.

**Flow:**
```
Self-service:
  GET /doctor-schedules/me → authenticate → authorize(VIEW_OWN_SCHEDULE) → controller.findMySchedule

Admin:
  GET /doctor-schedules → authenticate → authorize(MANAGE_SCHEDULES) → controller.findAll
  GET /doctor-schedules/:id → authenticate → authorize(MANAGE_SCHEDULES) → controller.findById
  GET /doctor-schedules/doctor/:doctorId → authenticate → authorize(MANAGE_SCHEDULES) → controller.findByDoctorId
  POST /doctor-schedules → authenticate → authorize(MANAGE_SCHEDULES) → validate → controller.create
  PATCH /doctor-schedules/:id → authenticate → authorize(MANAGE_SCHEDULES) → validate → controller.update
  DELETE /doctor-schedules/:id → authenticate → authorize(MANAGE_SCHEDULES) → controller.delete
```

**Note:** The same router is mounted at both `/doctor-schedules` and `/admin/doctor-schedules`.

**Dependencies:** `doctorScheduleRepository`, doctor lookup

**Database Tables:** `doctor_schedules`

**Business Rules:**
- `weekday` 0–6
- `endTime > startTime`, `slotDuration > 0`
- Unique per doctor + weekday + start_time
- Duplicate check on create and update
- Hard delete

---

### 3.8 Appointment Slots Module

**Purpose:** Individual bookable time slots.

**Flow:**
```
Public:
  GET /appointment-slots/available → controller.findAvailable (no auth)
  GET /appointment-slots/doctor/:doctorId → controller.findByDoctor (no auth)
  GET /appointment-slots/date/:slotDate → controller.findByDate (no auth)

Admin:
  GET /admin/appointment-slots → authenticate → authorize(MANAGE_SLOTS) → controller.findAll
  GET /admin/appointment-slots/:id → authenticate → authorize(MANAGE_SLOTS) → controller.findById
  GET /admin/appointment-slots/available → authenticate → authorize(MANAGE_SLOTS) → controller.findAvailable
  GET /admin/appointment-slots/doctor/:doctorId → authenticate → authorize(MANAGE_SLOTS) → controller.findByDoctor
  GET /admin/appointment-slots/date/:slotDate → authenticate → authorize(MANAGE_SLOTS) → controller.findByDate
  POST /admin/appointment-slots → authenticate → authorize(MANAGE_SLOTS) → validate → controller.create
  PATCH /admin/appointment-slots/:id → authenticate → authorize(MANAGE_SLOTS) → validate → controller.update
  DELETE /admin/appointment-slots/:id → authenticate → authorize(MANAGE_SLOTS) → controller.delete
```

**Dependencies:** `appointmentSlotRepository`, doctor lookup, schedule lookup

**Database Tables:** `appointment_slots`, `doctors`, `doctor_schedules`

**Business Rules:**
- `endTime > startTime`
- Status: `available` / `booked` / `cancelled` (default `available`)
- Unique per doctor + date + start_time
- No overlapping time ranges
- Soft delete

---

### 3.9 Appointments Module

**Purpose:** Appointment booking, management, and cancellation.

**Flow:**
```
Self-service:
  POST /appointments → authenticate → authorize(BOOK_APPOINTMENT, MANAGE_OWN_APPOINTMENTS)
    → validate(createAppointmentSelfSchema) → controller.createAsPatient
    → service.createAsPatient:
        → find patient by user_id
        → validate slot exists, not deleted, status = 'available'
        → Transaction: INSERT appointment + UPDATE slot status to 'booked'

  GET /appointments/mine → authenticate → authorize(MANAGE_OWN_APPOINTMENTS)
    → controller.findMyAppointments
    → service: find patient/doctor by user_id → find appointments

  PATCH /appointments/mine/:id → authenticate → authorize(MANAGE_OWN_APPOINTMENTS)
    → controller.cancelMyAppointment
    → service.cancelMyAppointment:
        → Find appointment
        → If patient: verify ownership + check not past appointment
        → If doctor: verify slot doctor_id matches doctor's id
        → cancelIfSchedulable: transaction — set status='cancelled', slot='available'

Admin:
  GET /appointments → authenticate → authorize(MANAGE_APPOINTMENTS)
  GET /appointments/:id → authenticate → authorize(MANAGE_APPOINTMENTS)
  GET /appointments/patient/:patientId → authenticate → authorize(MANAGE_APPOINTMENTS)
  GET /appointments/doctor/:doctorId → authenticate → authorize(MANAGE_APPOINTMENTS)
  POST /appointments (full) → authenticate → authorize(MANAGE_APPOINTMENTS)
    → validate(createAppointmentSchema) → controller.create
  PATCH /appointments/:id → authenticate → authorize(MANAGE_APPOINTMENTS)
    → validate(updateAppointmentSchema) → controller.update
    → service.update:
        → Transaction: if status changes to 'cancelled', set slot='available'
        → If status changes from 'cancelled' to 'scheduled'/'confirmed', set slot='booked'
  DELETE /appointments/:id → authenticate → authorize(MANAGE_APPOINTMENTS)
    → Transaction: DELETE appointment + UPDATE slot to 'available'
```

**Dependencies:** `appointmentRepository`, slot lookup, patient lookup, doctor lookup

**Database Tables:** `appointments`, `appointment_slots`, `patients`, `doctors`

**Business Rules:**
- Slot must be `available` and not soft-deleted
- One appointment per slot (UNIQUE)
- Transaction creates appointment + updates slot to `booked`
- Patients cancel own appointments only; past appointments cannot be cancelled
- Doctors cancel only appointments assigned to their slots
- Only `scheduled`/`confirmed` can be cancelled
- Status transitions update slot accordingly
- Delete releases slot to `available`

---

### 3.10 Payments Module

**Purpose:** Record payments for appointments.

**Flow:**
```
Self-service:
  POST /payments → authenticate → authorize(PAY_APPOINTMENT, MANAGE_PAYMENTS)
    → validate(createPaymentSchema) → controller.create
    → service: verify own appointment, check not cancelled/completed
  GET /payments/mine → authenticate → authorize(PAY_APPOINTMENT) → controller.findMyPayments

Admin:
  GET /payments → authenticate → authorize(MANAGE_PAYMENTS) → controller.findAll
  GET /payments/:id → authenticate → authorize(MANAGE_PAYMENTS) → controller.findById
  GET /payments/appointment/:appointmentId → authenticate → authorize(MANAGE_PAYMENTS)
  PATCH /payments/:id → authenticate → authorize(MANAGE_PAYMENTS) → validate → controller.update
  DELETE /payments/:id → authenticate → authorize(MANAGE_PAYMENTS) → controller.delete
```

**Dependencies:** `paymentRepository`, appointment lookup

**Database Tables:** `payments`, `appointments`

**Business Rules:**
- One payment per appointment (UNIQUE)
- `amount > 0`
- Methods: `cash`, `card`, `bank_transfer`, `online`
- Statuses: `pending`, `paid`, `failed`, `refunded` (default `pending`)
- Patients pay only for own appointments
- Cannot pay for cancelled or completed appointments
- `transaction_reference` is unique

---

### 3.11 Reviews Module

**Purpose:** Patient reviews for completed appointments.

**Flow:**
```
Self-service:
  POST /reviews → authenticate → authorize(MANAGE_OWN_REVIEWS)
    → validate(createReviewSchema) → controller.create
    → service: verify own completed appointment
  GET /reviews/mine → authenticate → authorize(MANAGE_OWN_REVIEWS, VIEW_OWN_REVIEWS)

Admin:
  GET /reviews → authenticate → authorize(MANAGE_REVIEWS)
  GET /reviews/:id → authenticate → authorize(MANAGE_REVIEWS)
  GET /reviews/appointment/:appointmentId → authenticate → authorize(MANAGE_REVIEWS)
  PATCH /reviews/:id → authenticate → authorize(MANAGE_REVIEWS) → validate → controller.update
  DELETE /reviews/:id → authenticate → authorize(MANAGE_REVIEWS) → controller.delete
```

**Dependencies:** `reviewRepository`, appointment lookup

**Database Tables:** `reviews`, `appointments`, `patients`

**Business Rules:**
- One review per appointment (UNIQUE)
- Rating 1–5
- Comment max 500 chars
- Only patient who owns the completed appointment can review
- Hard delete

---

### 3.12 Notifications Module (Placeholder)

**Purpose:** Not implemented. The `notifications` table exists in the database but there is no controller, service, repository, or routes for this module. The directory exists but contains only empty files or no functional code.

**Database Tables:** `notifications`

---

## 4. Complete API Documentation

### 4.1 Auth — `/api/v1/auth`

#### `POST /api/v1/auth/register`
Register a new patient account.

**Authentication:** None

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- `email`: valid email format
- `password`: 8–128 characters
- `fullName`: 1–255 characters

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "User registered successfully"
}
```

**Possible Errors:** 409 (email exists), 400 (validation)

**Business Rules:**
- Always creates `patient` role
- Transaction: create user + create patient profile
- Password hashed with bcrypt (12 rounds)

---

#### `POST /api/v1/auth/login`
Authenticate with email and password.

**Authentication:** None

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Possible Errors:** 401 (invalid credentials), 400 (validation)

---

#### `POST /api/v1/auth/refresh`
Exchange a refresh token for a new token pair.

**Authentication:** None

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Possible Errors:** 401 (invalid/expired/revoked token)

**Business Rules:**
- Old token revoked (single-use rotation)
- Token must be unrevoked and not expired in DB
- User must still exist

---

#### `POST /api/v1/auth/logout`
Revoke the current refresh token.

**Authentication:** Required (any role)

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response:** 204 No Content

---

#### `GET /api/v1/auth/me`
Get the currently authenticated user's profile.

**Authentication:** Required (any role)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "patient",
    "isVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

**Possible Errors:** 404 (user not found)

---

### 4.2 Users (Admin) — `/api/v1/admin/users`

All endpoints require: `authenticate` + `authorize(MANAGE_USERS)`

#### `GET /api/v1/admin/users`
List all users.

**Query Parameters:**
- `role` (optional): filter by role
- `isVerified` (optional): filter by verification status

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "patient",
      "isVerified": false,
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null
    }
  ]
}
```

---

#### `GET /api/v1/admin/users/:id`
Get user by ID.

**Response (200):** Single user object
**Possible Errors:** 404 (not found)

---

#### `PATCH /api/v1/admin/users/:id`
Update user fields.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "role": "doctor",
  "isVerified": true
}
```

All fields optional.

**Response (200):** Updated user object
**Possible Errors:** 404, 400, 409 (email conflict)

**Business Rules:**
- Email uniqueness check excludes current user's ID
- Cannot update soft-deleted user

---

#### `DELETE /api/v1/admin/users/:id`
Soft delete a user.

**Response:** 204 No Content
**Possible Errors:** 404, 400 (already deleted)

**Business Rules:**
- Sets `deleted_at = NOW()`, `updated_at = NOW()`
- Cannot delete an already-deleted user

---

### 4.3 Patients — `/api/v1/patients`

#### `GET /api/v1/patients/me`
Get own patient profile.

**Authentication:** Required — `VIEW_OWN_PROFILE`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "John Doe",
    "phone": null,
    "gender": null,
    "birthDate": null
  }
}
```

**Possible Errors:** 404 (profile not found)

---

#### `PATCH /api/v1/patients/me`
Update own patient profile.

**Authentication:** Required — `MANAGE_OWN_PROFILE`

**Request Body:**
```json
{
  "fullName": "John Updated",
  "phone": "+1234567890",
  "gender": "male",
  "birthDate": "1990-01-01"
}
```

All fields optional.

**Response (200):** Updated patient object

---

#### `POST /api/v1/patients`
Create a patient profile (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

**Request Body:**
```json
{
  "userId": "uuid",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "gender": "male",
  "birthDate": "1990-01-01"
}
```

**Response (201):** Created patient object

**Business Rules:**
- User must exist

---

#### `GET /api/v1/patients`
List all patients (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

**Response (200):** Array of patient objects

---

#### `GET /api/v1/patients/:id`
Get patient by ID (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

**Possible Errors:** 404

---

#### `GET /api/v1/patients/user/:userId`
Get patient by user ID (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

**Possible Errors:** 404

---

#### `PATCH /api/v1/patients/:id`
Update patient by ID (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

---

#### `DELETE /api/v1/patients/:id`
Delete patient by ID (admin).

**Authentication:** Required — `MANAGE_PATIENTS`

**Response:** 204 No Content

---

### 4.4 Doctors — `/api/v1/doctors` (Public)

#### `GET /api/v1/doctors`
List all doctors.

**Authentication:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "clinicId": "uuid",
      "specialtyId": "uuid",
      "consultationFee": "150.00",
      "bio": "Experienced cardiologist",
      "experienceYears": 10
    }
  ]
}
```

---

#### `GET /api/v1/doctors/:id`
Get doctor by ID.

**Authentication:** None

**Possible Errors:** 404

---

### 4.5 Doctors (Admin) — `/api/v1/admin/doctors`

All endpoints require: `authenticate` + `authorize(MANAGE_DOCTORS)`

#### `GET /api/v1/admin/doctors`
List all doctors.

---

#### `GET /api/v1/admin/doctors/:id`
Get doctor by ID.

---

#### `POST /api/v1/admin/doctors`
Create a doctor profile.

**Request Body:**
```json
{
  "userId": "uuid",
  "clinicId": "uuid",
  "specialtyId": "uuid",
  "consultationFee": 150.00,
  "bio": "Experienced cardiologist",
  "experienceYears": 10
}
```

**Business Rules:**
- User must exist with role `doctor`
- Clinic and specialty must exist

---

#### `PATCH /api/v1/admin/doctors/:id`
Update doctor profile.

---

#### `DELETE /api/v1/admin/doctors/:id`
Delete doctor profile.

**Response:** 204 No Content

---

### 4.6 Clinics — `/api/v1/clinics` (Public)

#### `GET /api/v1/clinics`
List all clinics.

**Authentication:** None

---

#### `GET /api/v1/clinics/:id`
Get clinic by ID.

**Authentication:** None

---

### 4.7 Clinics (Admin) — `/api/v1/admin/clinics`

All endpoints require: `authenticate` + `authorize(MANAGE_CLINICS)`

#### `GET /api/v1/admin/clinics` | List all clinics
#### `GET /api/v1/admin/clinics/:id` | Get by ID
#### `POST /api/v1/admin/clinics` | Create clinic
#### `PATCH /api/v1/admin/clinics/:id` | Update clinic
#### `DELETE /api/v1/admin/clinics/:id` | Delete clinic (RESTRICT if doctors exist)

---

### 4.8 Specialties — `/api/v1/specialties` (Public)

#### `GET /api/v1/specialties`
List all specialties.

**Authentication:** None

---

#### `GET /api/v1/specialties/:id`
Get specialty by ID.

**Authentication:** None

---

### 4.9 Specialties (Admin) — `/api/v1/admin/specialties`

All endpoints require: `authenticate` + `authorize(MANAGE_SPECIALTIES)`

#### `GET /api/v1/admin/specialties` | List all
#### `GET /api/v1/admin/specialties/:id` | Get by ID
#### `POST /api/v1/admin/specialties` | Create specialty
#### `PATCH /api/v1/admin/specialties/:id` | Update specialty
#### `DELETE /api/v1/admin/specialties/:id` | Delete (RESTRICT if used by doctors)

---

### 4.10 Doctor Schedules — `/api/v1/doctor-schedules`

#### `GET /api/v1/doctor-schedules/me`
Get own schedule.

**Authentication:** Required — `VIEW_OWN_SCHEDULE`

**Business Rules:**
- Scoped to the authenticated doctor's ID

---

#### `GET /api/v1/doctor-schedules`
List all schedules.

**Authentication:** Required — `MANAGE_SCHEDULES`

---

#### `GET /api/v1/doctor-schedules/:id`
Get schedule by ID.

**Authentication:** Required — `MANAGE_SCHEDULES`

---

#### `GET /api/v1/doctor-schedules/doctor/:doctorId`
Get schedules by doctor ID.

**Authentication:** Required — `MANAGE_SCHEDULES`

---

#### `POST /api/v1/doctor-schedules`
Create a schedule entry.

**Authentication:** Required — `MANAGE_SCHEDULES`

**Request Body:**
```json
{
  "doctorId": "uuid",
  "weekday": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30
}
```

**Validation:**
- `weekday`: 0–6
- `startTime`/`endTime`: HH:mm format, end > start
- `slotDuration`: integer > 0

---

#### `PATCH /api/v1/doctor-schedules/:id`
Update schedule entry.

---

#### `DELETE /api/v1/doctor-schedules/:id`
Delete schedule entry.

**Response:** 204 No Content

---

### 4.11 Appointment Slots — `/api/v1/appointment-slots` (Public)

#### `GET /api/v1/appointment-slots/available`
List available slots.

**Authentication:** None

**Query Parameters:**
- `doctorId` (optional): filter by doctor
- `date` (optional): filter by date (YYYY-MM-DD)

---

#### `GET /api/v1/appointment-slots/doctor/:doctorId`
Get slots by doctor ID.

**Authentication:** None

---

#### `GET /api/v1/appointment-slots/date/:slotDate`
Get slots by date.

**Authentication:** None

---

### 4.12 Appointment Slots (Admin) — `/api/v1/admin/appointment-slots`

All endpoints require: `authenticate` + `authorize(MANAGE_SLOTS)`

#### `GET /api/v1/admin/appointment-slots` | List all slots
#### `GET /api/v1/admin/appointment-slots/:id` | Get by ID
#### `GET /api/v1/admin/appointment-slots/available` | List available (with query params)
#### `GET /api/v1/admin/appointment-slots/doctor/:doctorId` | By doctor
#### `GET /api/v1/admin/appointment-slots/date/:slotDate` | By date
#### `POST /api/v1/admin/appointment-slots` | Create slot
#### `PATCH /api/v1/admin/appointment-slots/:id` | Update slot
#### `DELETE /api/v1/admin/appointment-slots/:id` | Soft delete slot

---

### 4.13 Appointments — `/api/v1/appointments`

#### `POST /api/v1/appointments` (Self-service)
Book an appointment for the authenticated patient.

**Authentication:** Required — `BOOK_APPOINTMENT` or `MANAGE_OWN_APPOINTMENTS`

**Request Body:**
```json
{
  "slotId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "slotId": "uuid",
    "status": "scheduled",
    "notes": null
  },
  "message": "Appointment created successfully"
}
```

---

#### `GET /api/v1/appointments/mine`
Get own appointments.

**Authentication:** Required — `MANAGE_OWN_APPOINTMENTS`

**Business Rules:**
- Patients see their own appointments
- Doctors see appointments assigned to their slots

---

#### `PATCH /api/v1/appointments/mine/:id`
Cancel own appointment.

**Authentication:** Required — `MANAGE_OWN_APPOINTMENTS`

**Business Rules:**
- Patients can only cancel their own appointments (ownership check)
- Doctors can only cancel appointments assigned to their slots
- Only `scheduled` or `confirmed` status can be cancelled
- Patients cannot cancel past appointments
- Transaction: set status `cancelled` + set slot `available`

---

#### `GET /api/v1/appointments` (Admin)
List all appointments.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

---

#### `GET /api/v1/appointments/:id` (Admin)
Get appointment by ID.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

---

#### `GET /api/v1/appointments/patient/:patientId` (Admin)
Get appointments by patient ID.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

---

#### `GET /api/v1/appointments/doctor/:doctorId` (Admin)
Get appointments by doctor ID.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

---

#### `POST /api/v1/appointments` (Admin — full body)
Create appointment with full data.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

**Request Body:**
```json
{
  "patientId": "uuid",
  "slotId": "uuid",
  "status": "scheduled",
  "notes": "Optional notes"
}
```

---

#### `PATCH /api/v1/appointments/:id` (Admin)
Update appointment (status, notes).

**Authentication:** Required — `MANAGE_APPOINTMENTS`

**Request Body:**
```json
{
  "status": "confirmed",
  "notes": "Updated notes"
}
```

**Business Rules:**
- Status change to `cancelled` → slot becomes `available`
- Status change from `cancelled` to `scheduled`/`confirmed` → slot becomes `booked`

---

#### `DELETE /api/v1/appointments/:id` (Admin)
Delete an appointment.

**Authentication:** Required — `MANAGE_APPOINTMENTS`

**Response:** 204 No Content

**Business Rules:**
- Transaction: delete appointment + set slot to `available`

---

### 4.14 Payments — `/api/v1/payments`

#### `POST /api/v1/payments`
Record a payment.

**Authentication:** Required — `PAY_APPOINTMENT` or `MANAGE_PAYMENTS`

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "amount": 150.00,
  "method": "card",
  "transactionReference": "TXN123456"
}
```

**Validation:**
- `appointmentId`: UUID
- `amount`: positive number
- `method`: enum (`cash`, `card`, `bank_transfer`, `online`)
- `transactionReference`: optional, unique

**Business Rules:**
- Patients can only pay for their own appointments
- Cannot pay for cancelled or completed appointments

---

#### `GET /api/v1/payments/mine`
Get own payments.

**Authentication:** Required — `PAY_APPOINTMENT`

---

#### `GET /api/v1/payments` (Admin)
List all payments.

**Authentication:** Required — `MANAGE_PAYMENTS`

---

#### `GET /api/v1/payments/:id` (Admin)
Get payment by ID.

**Authentication:** Required — `MANAGE_PAYMENTS`

---

#### `GET /api/v1/payments/appointment/:appointmentId` (Admin)
Get payment by appointment ID.

**Authentication:** Required — `MANAGE_PAYMENTS`

---

#### `PATCH /api/v1/payments/:id` (Admin)
Update payment.

**Authentication:** Required — `MANAGE_PAYMENTS`

---

#### `DELETE /api/v1/payments/:id` (Admin)
Delete payment.

**Authentication:** Required — `MANAGE_PAYMENTS`

**Response:** 204 No Content

---

### 4.15 Reviews — `/api/v1/reviews`

#### `POST /api/v1/reviews`
Create a review for a completed appointment.

**Authentication:** Required — `MANAGE_OWN_REVIEWS`

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "rating": 5,
  "comment": "Excellent service!"
}
```

**Validation:**
- `appointmentId`: UUID
- `rating`: 1–5
- `comment`: max 500 chars, optional

**Business Rules:**
- Only the patient who owns the appointment can review
- Only completed appointments can be reviewed
- One review per appointment

---

#### `GET /api/v1/reviews/mine`
Get own reviews.

**Authentication:** Required — `MANAGE_OWN_REVIEWS` or `VIEW_OWN_REVIEWS`

---

#### `GET /api/v1/reviews` (Admin)
List all reviews.

**Authentication:** Required — `MANAGE_REVIEWS`

---

#### `GET /api/v1/reviews/:id` (Admin)
Get review by ID.

**Authentication:** Required — `MANAGE_REVIEWS`

---

#### `GET /api/v1/reviews/appointment/:appointmentId` (Admin)
Get review by appointment ID.

**Authentication:** Required — `MANAGE_REVIEWS`

---

#### `PATCH /api/v1/reviews/:id` (Admin)
Update review.

**Authentication:** Required — `MANAGE_REVIEWS`

---

#### `DELETE /api/v1/reviews/:id` (Admin)
Delete review.

**Authentication:** Required — `MANAGE_REVIEWS`

**Response:** 204 No Content

---

## 5. Database Documentation

### 5.1 Entity Relationship Summary

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│     users     │1──1│   patients    │1──*│   appointments   │1──1│   payments    │
│              │     │              │     │                  │     │              │
│ id (PK)      │     │ id (PK)      │     │ id (PK)          │     │ id (PK)      │
│ email (UQ)   │     │ user_id (UQ) │     │ patient_id (FK)  │     │ appt_id (UQ) │
│ password_hash│     │ full_name    │     │ slot_id (UQ/FK)  │     │ amount (CK)  │
│ role (enum)  │     │ phone        │     │ status (enum)    │     │ method (enum)│
│ is_verified  │     │ gender       │     │ notes            │     │ status (enum)│
│ created_at   │     │ birth_date   │     └────────┬─────────┘     │ tx_ref (UQ)  │
│ updated_at   │     └──────────────┘              │              └──────────────┘
│ deleted_at   │                                    │                                      
└──────┬───────┘                                    │                                      
       │                       ┌────────────────────┘
       │                       │
       │              ┌────────┴──────────┐
       │              │     reviews       │
       │              │                   │
       │              │ id (PK)           │
       │              │ appt_id (UQ/FK)   │
       │              │ rating (CK 1-5)   │
       │              │ comment           │
       │              └───────────────────┘
       │
       │              ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
       │              │   clinics    │1──*│     doctors      │1──*│   doctor_schedules    │
       │              │             │     │                  │     │                       │
       │              │ id (PK)     │     │ id (PK)          │     │ id (PK)               │
       │              │ name        │     │ user_id (UQ/FK)  │     │ doctor_id (FK)        │
       │              │ phone       │     │ clinic_id (FK)   │     │ weekday (CK 0-6)      │
       │              │ address     │     │ specialty_id (FK) │     │ start_time            │
       │              │ city        │     │ consultation_fee  │     │ end_time (CK > start) │
       │              │ description │     │ bio              │     │ slot_duration (CK >0) │
       │              └──────────────┘     │ experience_years │     │ (UQ: doctor,wd,start)│
       │              ┌──────────────┐     └────────┬─────────┘     └───────────┬───────────┘
       │              │ specialties  │              │                           │
       │              │              │              │                           │
       │              │ id (PK)      │1──*──────────┘                           │
       │              │ name (UQ)    │                                          │
       │              └──────────────┘              ┌───────────────────────────┘
       │                                            │
       │              ┌─────────────────────────────┴──────────────────────────┐
       │              │                    appointment_slots                   │
       │              │                                                        │
       │              │ id (PK)                                                │
       │              │ doctor_id (FK)                                         │
       │              │ doctor_schedule_id (FK)                                │
       │              │ slot_date                                              │
       │              │ start_time                                             │
       │              │ end_time (CK > start)                                  │
       │              │ status (enum: available/booked/cancelled)              │
       │              │ created_at                                             │
       │              │ updated_at                                             │
       │              │ deleted_at (soft delete)                               │
       │              │ (UQ: doctor,date,start)                                │
       │              └────────────────────────────────────────────────────────┘
       │
       │              ┌──────────────────┐     ┌──────────────────┐
       │              │  notifications   │     │  refresh_tokens  │
       │              │                  │     │                  │
       │              │ id (PK)          │     │ id (PK)          │
       └──*───────────│ user_id (FK)     │     │ user_id (FK)     │
                      │ title            │     │ token_hash (UQ)  │
                      │ message          │     │ expires_at       │
                      │ is_read          │     │ revoked_at       │
                      └──────────────────┘     │ created_at       │
                                               └──────────────────┘
```

### 5.2 Table Definitions

#### `users` — Core user identities
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `role` | user_role | NOT NULL, DEFAULT `'patient'` | Enum |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete |
**Indexes:** `idx_users_role`, `idx_users_deleted_at_partial` (WHERE deleted_at IS NOT NULL)

#### `patients` — Patient profiles
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users(id) CASCADE | 1-to-1 with users |
| `full_name` | VARCHAR(255) | NOT NULL | |
| `phone` | VARCHAR(50) | NULLABLE | |
| `gender` | VARCHAR(20) | NULLABLE | |
| `birth_date` | DATE | NULLABLE | |
**Indexes:** `idx_patients_full_name`

#### `doctors` — Doctor profiles
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users(id) CASCADE | 1-to-1 with users |
| `clinic_id` | UUID | NOT NULL, FK → clinics(id) RESTRICT | |
| `specialty_id` | UUID | NOT NULL, FK → specialties(id) RESTRICT | |
| `consultation_fee` | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) | |
| `bio` | TEXT | NULLABLE | |
| `experience_years` | SMALLINT | NOT NULL, DEFAULT 0, CHECK (>= 0) | |
**Indexes:** `idx_doctors_clinic_id`, `idx_doctors_specialty_id`

#### `clinics` — Clinic locations
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `name` | VARCHAR(255) | NOT NULL |
| `phone` | VARCHAR(50) | NULLABLE |
| `address` | TEXT | NULLABLE |
| `city` | VARCHAR(100) | NULLABLE |
| `description` | TEXT | NULLABLE |
**Indexes:** `idx_clinics_name`, `idx_clinics_city`

#### `specialties` — Medical specialties
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE |

#### `doctor_schedules` — Weekly schedule templates
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `doctor_id` | UUID | NOT NULL, FK → doctors(id) CASCADE |
| `weekday` | SMALLINT | NOT NULL, CHECK (0–6) |
| `start_time` | TIME | NOT NULL |
| `end_time` | TIME | NOT NULL, CHECK (> start_time) |
| `slot_duration` | SMALLINT | NOT NULL, CHECK (> 0) |
**Unique:** `(doctor_id, weekday, start_time)`

#### `appointment_slots` — Individual bookable slots
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | |
| `doctor_id` | UUID | NOT NULL, FK → doctors(id) CASCADE | |
| `doctor_schedule_id` | UUID | NOT NULL, FK → doctor_schedules(id) CASCADE | |
| `slot_date` | DATE | NOT NULL | |
| `start_time` | TIME | NOT NULL | |
| `end_time` | TIME | NOT NULL, CHECK (> start_time) | |
| `status` | slot_status | NOT NULL, DEFAULT `'available'` | Enum |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` | |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete |
**Indexes:** `idx_appointment_slots_doctor_id`, `idx_appointment_slots_doctor_schedule_id`, `idx_appointment_slots_slot_date_status`, `idx_appointment_slots_deleted_at_partial` (WHERE deleted_at IS NOT NULL)
**Unique:** `(doctor_id, slot_date, start_time)`

#### `appointments` — Patient appointment bookings
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `patient_id` | UUID | NOT NULL, FK → patients(id) RESTRICT |
| `slot_id` | UUID | NOT NULL, UNIQUE, FK → appointment_slots(id) RESTRICT |
| `status` | appointment_status | NOT NULL, DEFAULT `'scheduled'` |
| `notes` | TEXT | NULLABLE |
**Indexes:** `idx_appointments_patient_id`, `idx_appointments_status`

#### `payments` — Payment records
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `appointment_id` | UUID | NOT NULL, UNIQUE, FK → appointments(id) RESTRICT |
| `amount` | NUMERIC(10,2) | NOT NULL, CHECK (> 0) |
| `method` | payment_method | NOT NULL |
| `status` | payment_status | NOT NULL, DEFAULT `'pending'` |
| `transaction_reference` | VARCHAR(255) | NULLABLE, UNIQUE |
**Indexes:** `idx_payments_status`

#### `reviews` — Appointment reviews
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `appointment_id` | UUID | NOT NULL, UNIQUE, FK → appointments(id) CASCADE |
| `rating` | SMALLINT | NOT NULL, CHECK (1–5) |
| `comment` | TEXT | NULLABLE |

#### `notifications` — User notifications (unimplemented)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `user_id` | UUID | NOT NULL, FK → users(id) CASCADE |
| `title` | VARCHAR(255) | NOT NULL |
| `message` | TEXT | NOT NULL |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT `FALSE` |
**Indexes:** `idx_notifications_user_id`, `idx_notifications_user_id_is_read`

#### `refresh_tokens` — JWT refresh token store
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` |
| `user_id` | UUID | NOT NULL, FK → users(id) CASCADE |
| `token_hash` | VARCHAR(255) | NOT NULL, UNIQUE |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `revoked_at` | TIMESTAMPTZ | NULLABLE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `NOW()` |
**Indexes:** `idx_refresh_tokens_user_id`, `idx_refresh_tokens_token_hash` (UNIQUE), `idx_refresh_tokens_user_id_revoked_at`

### 5.3 Migration Order

1. `001_create_extensions.sql` — Enable `pgcrypto` extension (for `gen_random_uuid()`)
2. `002_create_enums.sql` — Create all enum types
3. `003_create_tables.sql` — Create all 11 tables with constraints, foreign keys, and indexes
4. `004_create_indexes.sql` — Additional performance indexes
5. `005_create_refresh_tokens.sql` — Create refresh_tokens table

### 5.4 Delete Action Strategy

| FK | On Delete | Rationale |
|----|-----------|-----------|
| users → patients | CASCADE | Patient profile deleted with user |
| users → doctors | CASCADE | Doctor profile deleted with user |
| users → notifications | CASCADE | Notifications deleted with user |
| users → refresh_tokens | CASCADE | Tokens cleaned up with user |
| clinics → doctors | RESTRICT | Prevent orphaned doctors |
| specialties → doctors | RESTRICT | Prevent orphaned doctors |
| doctors → doctor_schedules | CASCADE | Schedules deleted with doctor |
| doctors → appointment_slots | CASCADE | Slots deleted with doctor |
| doctor_schedules → appointment_slots | CASCADE | Slots deleted with schedule |
| patients → appointments | RESTRICT | Prevent orphaned appointments |
| appointment_slots → appointments | RESTRICT | Prevent orphaned appointments |
| appointments → payments | RESTRICT | Prevent orphaned payments |
| appointments → reviews | CASCADE | Reviews deleted with appointment |

---

## 6. Authentication Flow

### Complete Login Flow Diagram

```
Client                           Server                               Database
  │                                │                                    │
  │  POST /auth/login              │                                    │
  │  { email, password }           │                                    │
  │ ─────────────────────────────► │                                    │
  │                                │                                    │
  │                                │  validate(loginSchema)             │
  │                                │  ────── Zod safeParse ──────────► │
  │                                │  ◄───── parsed/error ─────────── │
  │                                │                                    │
  │                                │  authRepository.findByEmail()      │
  │                                │  ────── SELECT ... WHERE ────────► │
  │                                │  │    email=$1 AND deleted_at IS   │
  │                                │  │    NULL                         │
  │                                │  ◄───── UserRecord | null ─────── │
  │                                │                                    │
  │                                │  if !user: 401 "Invalid email     │
  │                                │           or password"             │
  │                                │                                    │
  │                                │  comparePassword(password, hash)   │
  │                                │  ────── bcrypt.compare ──────────► │
  │                                │  ◄───── boolean ───────────────── │
  │                                │                                    │
  │                                │  if !valid: 401 "Invalid email    │
  │                                │            or password"            │
  │                                │                                    │
  │                                │  generateTokens(userId, role)      │
  │                                │  ┌─────────────────────────────┐  │
  │                                │  │ accessToken =                │  │
  │                                │  │   jwt.sign({ sub, role },    │  │
  │                                │  │     JWT_SECRET,              │  │
  │                                │  │     { expiresIn: '15m' })    │  │
  │                                │  │                              │  │
  │                                │  │ refreshToken =                │  │
  │                                │  │   jwt.sign({ sub, jti },      │  │
  │                                │  │     JWT_REFRESH_SECRET,       │  │
  │                                │  │     { expiresIn: '7d' })     │  │
  │                                │  └─────────────────────────────┘  │
  │                                │                                    │
  │                                │  hashToken(refreshToken)           │
  │                                │  ────── crypto: SHA-256 ─────────► │
  │                                │                                    │
  │                                │  persistRefreshToken()             │
  │                                │  ────── INSERT INTO ─────────────► │
  │                                │  │    refresh_tokens               │
  │                                │  ◄───── OK ───────────────────── │
  │                                │                                    │
  │  ◄───── 200 { accessToken,    │                                    │
  │           refreshToken }      │                                    │
  │                                │                                    │
```

### Token Validation Flow (per request)

```
Request with Authorization: Bearer <accessToken>
  │
  ▼
authenticate() middleware
  │
  ├── Extract header → no header? → 401 "Missing authorization header"
  │
  ├── Parse "Bearer <token>" → wrong format? → 401 "Invalid authorization header format"
  │
  ├── jwt.verify(token, JWT_SECRET)
  │     ├── invalid/expired? → 401 "Invalid or expired token"
  │     └── valid → decode { sub, role }
  │
  └── req.user = { sub, role } → next()

authorize(...permissions) middleware
  │
  ├── !req.user? → 401 "Authentication required"
  │
  ├── RolePermissions[role] → no permissions? → 403 "Insufficient permissions"
  │
  ├── permissions.some(p => userPermissions.includes(p))
  │     └── false? → 403 "Insufficient permissions"
  │
  └── next()
```

### Refresh Token Rotation Flow

```
Client                                Server                              Database
  │                                     │                                   │
  │  POST /auth/refresh                 │                                   │
  │  { refreshToken }                   │                                   │
  │ ──────────────────────────────────► │                                   │
  │                                     │                                   │
  │                                     │  jwt.verify(token,                │
  │                                     │    JWT_REFRESH_SECRET)            │
  │                                     │  → payload { sub, jti }          │
  │                                     │                                   │
  │                                     │  hashToken(refreshToken)          │
  │                                     │  → SHA-256 hash                  │
  │                                     │                                   │
  │                                     │  findRefreshToken(hash)           │
  │                                     │  ── SELECT ... WHERE ───────────► │
  │                                     │  │  token_hash=$1                │
  │                                     │  │  AND revoked_at IS NULL       │
  │                                     │  │  AND expires_at > NOW()       │
  │                                     │  ◄── RefreshTokenRow | null ─── │
  │                                     │                                   │
  │                                     │  if not found: 401               │
  │                                     │                                   │
  │                                     │  findById(payload.sub)           │
  │                                     │  ── SELECT ... WHERE ───────────► │
  │                                     │  │  id=$1 AND deleted_at IS NULL │
  │                                     │  ◄── UserRecord | null ──────── │
  │                                     │                                   │
  │                                     │  if not found: 401               │
  │                                     │                                   │
  │                                     │  revokeRefreshToken(hash)         │
  │                                     │  ── UPDATE SET ─────────────────► │
  │                                     │  │  revoked_at=NOW()             │
  │                                     │  ◄── OK ─────────────────────── │
  │                                     │                                   │
  │                                     │  generateTokens(user.id, role)    │
  │                                     │  persistRefreshToken(user.id,     │
  │                                     │    newRefreshToken)               │
  │                                     │  ── INSERT INTO ────────────────► │
  │                                     │  │  refresh_tokens               │
  │                                     │  ◄── OK ─────────────────────── │
  │                                     │                                   │
  │  ◄── 200 { newAccessToken,          │                                   │
  │           newRefreshToken }          │                                   │
```

---

## 7. Authorization Matrix

| Permission | admin | doctor | patient | Protected Routes |
|-----------|-------|--------|---------|-----------------|
| `MANAGE_USERS` | ✓ | ✗ | ✗ | `/admin/users/*` |
| `MANAGE_PATIENTS` | ✓ | ✗ | ✗ | `/patients` (admin) |
| `MANAGE_DOCTORS` | ✓ | ✗ | ✗ | `/admin/doctors/*` |
| `MANAGE_CLINICS` | ✓ | ✗ | ✗ | `/admin/clinics/*` |
| `MANAGE_SPECIALTIES` | ✓ | ✗ | ✗ | `/admin/specialties/*` |
| `MANAGE_SCHEDULES` | ✓ | ✗ | ✗ | `/doctor-schedules/*` (admin) |
| `MANAGE_SLOTS` | ✓ | ✗ | ✗ | `/admin/appointment-slots/*` |
| `MANAGE_APPOINTMENTS` | ✓ | ✗ | ✗ | `/appointments` (admin) |
| `MANAGE_PAYMENTS` | ✓ | ✗ | ✗ | `/payments` (admin) |
| `MANAGE_REVIEWS` | ✓ | ✗ | ✗ | `/reviews` (admin) |
| `MANAGE_NOTIFICATIONS` | ✓ | ✗ | ✗ | Not implemented |
| `VIEW_OWN_PROFILE` | ✗ | ✓ | ✓ | `/patients/me` (GET) |
| `MANAGE_OWN_PROFILE` | ✗ | ✓ | ✓ | `/patients/me` (PATCH) |
| `VIEW_OWN_SCHEDULE` | ✗ | ✓ | ✗ | `/doctor-schedules/me` |
| `BOOK_APPOINTMENT` | ✗ | ✗ | ✓ | `/appointments` (POST, self) |
| `MANAGE_OWN_APPOINTMENTS` | ✗ | ✓ | ✓ | `/appointments/mine`, `/appointments/mine/:id` |
| `PAY_APPOINTMENT` | ✗ | ✗ | ✓ | `/payments` (POST, mine GET) |
| `MANAGE_OWN_REVIEWS` | ✗ | ✗ | ✓ | `/reviews` (POST, mine GET) |
| `VIEW_OWN_REVIEWS` | ✗ | ✓ | ✗ | `/reviews/mine` |

---

## 8. Business Rules

### Authentication
1. Registration always creates role `patient` with a corresponding patient profile in a single transaction
2. Email must be unique (lookup excludes soft-deleted users)
3. Password must be 8–128 characters; hashed with bcrypt using 12 salt rounds
4. Soft-deleted users cannot log in (query excludes `deleted_at IS NOT NULL`)
5. Refresh tokens are single-use — revoked on each successful refresh
6. Refresh token validation checks both JWT expiry and database `expires_at`
7. Logout sets `revoked_at = NOW()` on the refresh token

### User Management
8. Only admins with `MANAGE_USERS` permission can access user management
9. Cannot update a soft-deleted user
10. Email uniqueness check excludes the current user's ID on update
11. Soft delete sets both `deleted_at` and `updated_at` to `NOW()`
12. Cannot soft-delete an already-deleted user

### Patients
13. One patient record per user (UNIQUE constraint on `user_id`)
14. Patients can view and edit their own profile via `/me` endpoints
15. Birth date validated against YYYY-MM-DD regex pattern

### Doctors
16. To create a doctor profile, the user must exist and have role `doctor`
17. Clinic and specialty references must exist
18. One doctor per user (UNIQUE constraint on `user_id`)
19. `consultation_fee >= 0` (database CHECK constraint)
20. `experience_years >= 0` (database CHECK constraint, default 0)
21. Doctor profile is hard-deleted

### Clinics
22. Clinics with doctors cannot be deleted (database `ON DELETE RESTRICT`)
23. Hard delete

### Specialties
24. Name is unique
25. Name conflict checked on create AND update
26. Specialties used by doctors cannot be deleted (`ON DELETE RESTRICT`)
27. Hard delete

### Doctor Schedules
28. `weekday` must be 0–6 (Sunday–Saturday)
29. `endTime` must be after `startTime`
30. `slotDuration` must be > 0 (minutes)
31. Unique per doctor + weekday + start_time
32. Duplicate check on create and update
33. Doctors can view their own schedule via `/me` endpoint
34. Hard delete

### Appointment Slots
35. `endTime` must be after `startTime`
36. Status must be `available`, `booked`, or `cancelled` (default `available`)
37. Unique per doctor + slot_date + start_time
38. No overlapping time ranges allowed (checked via `start_time < ?end AND end_time > ?start`)
39. Doctor must exist
40. DoctorSchedule must exist
41. Soft delete with partial index on `deleted_at`

### Appointments
42. Patient must exist
43. Slot must exist, not soft-deleted, and status must be `available`
44. Each slot can have at most one appointment (UNIQUE constraint on `slot_id`)
45. Transaction: create appointment + set slot status to `booked`
46. Self-booking only requires `slotId` (patient ID inferred from authentication)
47. Appointment statuses: `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`
48. Patients can only cancel their own appointments
49. Doctors can only cancel appointments assigned to their slots
50. Only `scheduled` or `confirmed` appointments can be cancelled
51. Patients cannot cancel past appointments (checked via slot date + time against `NOW()`)
52. When cancelled: slot status set to `available`
53. When restored from cancelled to scheduled/confirmed: slot set to `booked`
54. Deleting an appointment releases the slot back to `available`

### Payments
55. One payment per appointment (UNIQUE constraint on `appointment_id`)
56. Amount must be > 0 (database CHECK constraint)
57. Methods: `cash`, `card`, `bank_transfer`, `online`
58. Statuses: `pending`, `paid`, `failed`, `refunded` (default `pending`)
59. `transaction_reference` is unique
60. Patients can only pay for their own appointments
61. Cannot pay for cancelled or completed appointments

### Reviews
62. One review per appointment (UNIQUE constraint on `appointment_id`)
63. Rating must be 1–5 (database CHECK constraint)
64. Comment max 500 characters
65. Only the patient who owns the completed appointment can review it
66. Patients can view their own reviews
67. Hard delete

---

## 9. Security Review

### 9.1 JWT
- Access tokens signed with `JWT_SECRET` (min 32 chars)
- Refresh tokens signed with separate `JWT_REFRESH_SECRET`
- Token expiry configurable via environment variables
- `jwt.verify()` used on every authenticated request
- No sensitive data in token payload — only `sub` (user ID) and `role`

### 9.2 Authorization
- Role-based permissions (RBAC) with granular `Permission` strings
- `authorize()` middleware checks role → permissions map
- OR logic: any matching permission grants access
- Ownership enforced at service layer (not just middleware)

### 9.3 Ownership (IDOR Prevention)
- `/patients/me` — returns profile matching `req.user.sub`
- `/appointments/mine` — returns appointments scoped to patient/doctor
- `/appointments/mine/:id` — verifies patient owns appointment or doctor owns slot
- `/payments/mine` — returns payments for own appointments
- Cancel/delete operations verify ownership before execution
- Authentication is REQUIRED for any resource access beyond public reads

### 9.4 Validation
- All request bodies validated with Zod schemas before controller execution
- `z.string().uuid()` for all UUID fields
- `z.string().email()` for email fields
- `z.string().min(8).max(128)` for passwords
- `z.enum([...])` matching database enum values
- `z.string().regex(...)` for date (YYYY-MM-DD) and time (HH:mm) formats
- Cross-field `.refine()` for `endTime > startTime` validation
- `safeParse()` used — never throws, returns detailed error issues

### 9.5 SQL Injection Prevention
- All queries use parameterized prepared statements (`$1`, `$2`, etc.)
- No string concatenation for user input
- Library: `pg` with parameterized query API

### 9.6 Mass Assignment Prevention
- DTOs explicitly define which fields can be updated
- `req.body` is replaced with parsed Zod output (only schema-defined fields)
- Update operations only touch fields present in the request

### 9.7 Refresh Token Rotation
- Each refresh token hashed with SHA-256 before storage
- Old token revoked on each successful refresh
- Double validation: JWT signature + database lookup (unrevoked + not expired)
- Prevents replay attacks: compromised token can be used at most once

### 9.8 Transactions
- Multi-table writes wrapped in `BEGIN` / `COMMIT` / `ROLLBACK`
- Uses `BaseRepository.transaction()` — acquires dedicated connection
- Automatic rollback on error prevents partial writes

### 9.9 Soft Delete
- `users` and `appointment_slots` use soft delete
- All queries filter `WHERE deleted_at IS NULL`
- Partial indexes on `deleted_at` for performance
- Soft-deleted users cannot authenticate

### 9.10 Password Handling
- bcrypt with 12 salt rounds
- `password_hash` column stores hash, never plaintext
- `hashPassword()` and `comparePassword()` utility functions

### 9.11 Error Information Leakage
- Validation errors return specific field-level issues (intentional, for debugging)
- Authentication errors return generic "Invalid email or password" (not revealing which is wrong)
- Unexpected errors return generic "An unexpected error occurred" with status 500
- PostgreSQL errors caught and converted to 400 "Invalid input format" for code `22P02`
- No stack traces exposed in production responses

---

## 10. Request Lifecycle

```
1. HTTP Request arrives at server (port 3001)
   │
2. Express: app.ts
   │  app.use(express.json()) — parse JSON body
   │  app.use("/api/v1", routes) — route to API router
   │
3. Routes: routes/index.ts
   │  Match path prefix → module router
   │  e.g., /api/v1/auth/register → authRouter
   │
4. Module Route: auth.routes.ts
   │  Middleware chain (if any):
   │  POST /register → validate(registerSchema) → authController.register
   │
5. Validation Middleware: validate(schema)
   │  schema.safeParse(req.body)
   │  FAIL → respond 400 with validation errors (Zod issues)
   │  PASS → req.body = parsed data, next()
   │
6. Authentication Middleware: authenticate() (if required)
   │  Extract Authorization header
   │  Parse "Bearer <token>"
   │  jwt.verify(token, JWT_SECRET)
   │  FAIL → throw AppError(401)
   │  PASS → req.user = { sub, role }, next()
   │
7. Authorization Middleware: authorize(...permissions) (if required)
   │  RolePermissions[req.user.role] includes any required permission?
   │  NO → throw AppError(403)
   │  YES → next()
   │
8. Controller Method
   │  Extract data from req.params, req.query, req.body, req.user
   │  Call service method
   │  try/catch → next(error) on failure
   │
9. Service Method
   │  Business logic, validation, orchestration
   │  May call repository methods (one or multiple)
   │  May wrap in repository.transaction()
   │  On business rule violation: throw AppError (e.g., notFound, conflict, badRequest)
   │
10. Repository Method
    │  Execute parameterized SQL via this.query(text, params)
    │  Returns typed record or null
    │  Within transaction: uses client from beginTransaction()
    │
11. Database (PostgreSQL)
    │  Execute query, enforce constraints (UNIQUE, CHECK, FK)
    │  Return result set
    │
12. Response Construction
    │  Controller uses BaseController helpers:
    │    ok() → ApiResponse.success() → { success: true, data }
    │    created() → ApiResponse.created() → 201 { success: true, data, message }
    │    noContent() → 204 (empty body)
    │    paginated() → { success: true, data, pagination }
    │
13. Error Handler (if next(error) called)
    │  errorMiddleware():
    │    if AppError + isOperational → respond with statusCode and message
    │    if PostgreSQL code 22P02 → 400 "Invalid input format"
    │    else → 500 "An unexpected error occurred"
    │
14. HTTP Response sent to client
```

---

## 11. Code Quality Review

### Strengths

| Aspect | Assessment |
|--------|------------|
| **Modularity** | Each domain is self-contained with clear separation of concerns (controller/service/repository/routes/validation/types/interfaces). Modules can be developed, tested, and understood independently. |
| **Consistent Structure** | Every module follows the exact same 8-file pattern. Predictable and easy to onboard new developers. |
| **Layered Architecture** | Strict layering: controllers don't call repositories directly, services don't handle HTTP responses. Clear dependency direction. |
| **Raw SQL** | Parameterized queries throughout — no ORM overhead, full control over SQL, no N+1 query problems. |
| **Transaction Support** | Robust transaction management in `BaseRepository` with support for both high-level (`transaction()`) and low-level (`beginTransaction`/`commit`/`rollback`) APIs. Nested transaction support via client reuse. |
| **TypeScript Usage** | Strict TypeScript with typed interfaces for all records, DTOs, and parameters. Type augmentation for Express `Request.user`. |
| **Validation** | Zod schemas are comprehensive with proper enums, UUID validation, regex patterns for dates/times, and cross-field refinements. |
| **Error Handling** | Custom `AppError` class with static factories for common HTTP errors. Global error handler distinguishes operational vs unexpected errors. |
| **RBAC** | Permission-based authorization is granular and declarative. Role-permission mapping is centralized in one file. |
| **Security** | Password hashing, JWT, refresh rotation, parameterized queries, input validation, ownership checks — all implemented. |
| **Startup** | Auto-migration on server start — no manual migration commands needed. Idempotent migration runner with `schema_migrations` tracking table. |

### Areas for Improvement

| Area | Issue | Suggestion |
|------|-------|------------|
| **DI / IoC** | Modules import singletons directly (e.g., `import { appointmentService } from "./appointment.service.js"`). This makes unit testing harder. | Consider dependency injection or factory functions, or at minimum make dependencies configurable. |
| **Unit Tests** | No test framework, no test files. `npm test` is a placeholder. | Add Jest or Vitest with unit tests for services and integration tests for endpoints. |
| **Pagination** | Pagination types and defaults exist (`PaginationParams`, `PaginationMeta`, `PaginationDefaults`) but are only partially used. Most list endpoints return all records without pagination. | Implement consistent pagination across all list endpoints with query params (`page`, `limit`). |
| **Filtering/Sorting** | No query parameter filtering or sorting for list endpoints. User module has a filter schema but it's not universally applied. | Add reusable filtering and sorting infrastructure. |
| **Logging** | Only `console.log`/`console.error` for logging. | Replace with structured logging (pino, winston) for production observability. |
| **Rate Limiting** | No rate limiting on authentication endpoints. | Add `express-rate-limit` to auth routes to prevent brute force attacks. |
| **API Versioning** | Path `/api/v1` is hardcoded. | Formalize versioning with a configurable base path or version negotiation. |
| **Health Check** | No health check endpoint. | Add `GET /health` for monitoring and container orchestration. |
| **OpenAPI** | No API documentation specification. | Generate OpenAPI/Swagger spec from types (using Zod-to-OpenAPI converter). |
| **Soft Delete Inconsistency** | Only `users` and `appointment_slots` support soft delete. Other tables use hard delete. | Evaluate which tables need soft delete for audit/compliance purposes. |
| **Validation Location** | Some validation (e.g., existing checks) is in services, some in repository. | Move all business validation to the service layer consistently. Repositories should only do data access. |
| **Seed Data** | No seed scripts for development/demo data. | Add seed script for clinics, specialties, doctors, and sample schedules. |
| **Notifications Module** | Table exists but module is empty. | Either implement or remove. |
| **Admin Seed** | Environment variables for admin seed exist but are commented out. | Implement admin user seeding logic on first startup. |
| **Error Response Consistency** | `AppError` uses `details` property, but validation errors use `errors` from `ApiResponse.error()`. | Standardize error detail format. |

---

## 12. Production Readiness

### Architecture
- ✅ **Modular layered** — clear separation of concerns, domain-driven
- ✅ **Stateless** — no server-side session state (except refresh tokens in DB)
- ✅ **RESTful** — standard HTTP methods, resource-based URLs, proper status codes
- ⚠️ **Missing**: Health endpoint, graceful shutdown handling

### Security
- ✅ **Authentication** — JWT with short-lived access tokens
- ✅ **Refresh Rotation** — single-use tokens prevent replay
- ✅ **Authorization** — RBAC with granular permissions
- ✅ **Input Validation** — Zod schemas on all endpoints
- ✅ **SQL Injection** — parameterized queries everywhere
- ✅ **Password Security** — bcrypt (12 rounds)
- ✅ **IDOR Prevention** — ownership checks in services
- ⚠️ **Missing**: Rate limiting, request size limiting, CORS configuration, helmet security headers, CSRF protection (stateless JWT so CSRF is less relevant)

### Performance
- ✅ **Connection Pooling** — pg Pool with configurable pool size
- ✅ **Indexes** — 14 indexes covering foreign keys, lookups, and soft-delete filters
- ✅ **Raw SQL** — no ORM overhead
- ⚠️ **Missing**: Query performance monitoring, database connection pool tuning for production load

### Maintainability
- ✅ **Consistent Structure** — every module follows same pattern
- ✅ **TypeScript** — strict mode, full type coverage
- ✅ **Centralized Configuration** — env.ts with Zod validation
- ✅ **Migrations** — versioned, idempotent, auto-applied
- ✅ **Error Handling** — consistent AppError pattern
- ⚠️ **Missing**: Unit tests, integration tests, CI/CD pipeline, linting configuration

### Scalability
- ✅ **Stateless API** — horizontal scaling possible
- ✅ **Database Indexes** — good coverage for common queries
- ⚠️ **Limitation**: No caching layer (Redis), no read replicas, no message queue for async operations (e.g., notifications)
- ⚠️ **Limitation**: All business logic runs synchronously in request thread

### Overall Assessment

The backend is **structurally well-designed** with clean architecture, consistent patterns, and solid security fundamentals. It is **suitable for production** with the addition of:
1. Rate limiting on auth endpoints
2. Comprehensive test suite
3. Structured logging
4. Health check endpoint
5. CORS configuration
6. Security headers (helmet)
7. Proper error logging (not just console)

---

## 13. API Quick Reference

| # | Method | Route | Auth | Permission | Module |
|---|--------|-------|------|------------|--------|
| 1 | POST | `/auth/register` | No | — | Auth |
| 2 | POST | `/auth/login` | No | — | Auth |
| 3 | POST | `/auth/refresh` | No | — | Auth |
| 4 | POST | `/auth/logout` | Yes | — | Auth |
| 5 | GET | `/auth/me` | Yes | — | Auth |
| 6 | GET | `/admin/users` | Yes | `MANAGE_USERS` | Users |
| 7 | GET | `/admin/users/:id` | Yes | `MANAGE_USERS` | Users |
| 8 | PATCH | `/admin/users/:id` | Yes | `MANAGE_USERS` | Users |
| 9 | DELETE | `/admin/users/:id` | Yes | `MANAGE_USERS` | Users |
| 10 | GET | `/patients/me` | Yes | `VIEW_OWN_PROFILE` | Patients |
| 11 | PATCH | `/patients/me` | Yes | `MANAGE_OWN_PROFILE` | Patients |
| 12 | POST | `/patients` | Yes | `MANAGE_PATIENTS` | Patients |
| 13 | GET | `/patients` | Yes | `MANAGE_PATIENTS` | Patients |
| 14 | GET | `/patients/:id` | Yes | `MANAGE_PATIENTS` | Patients |
| 15 | GET | `/patients/user/:userId` | Yes | `MANAGE_PATIENTS` | Patients |
| 16 | PATCH | `/patients/:id` | Yes | `MANAGE_PATIENTS` | Patients |
| 17 | DELETE | `/patients/:id` | Yes | `MANAGE_PATIENTS` | Patients |
| 18 | GET | `/doctors` | No | — | Doctors |
| 19 | GET | `/doctors/:id` | No | — | Doctors |
| 20 | GET | `/admin/doctors` | Yes | `MANAGE_DOCTORS` | Doctors |
| 21 | GET | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` | Doctors |
| 22 | POST | `/admin/doctors` | Yes | `MANAGE_DOCTORS` | Doctors |
| 23 | PATCH | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` | Doctors |
| 24 | DELETE | `/admin/doctors/:id` | Yes | `MANAGE_DOCTORS` | Doctors |
| 25 | GET | `/clinics` | No | — | Clinics |
| 26 | GET | `/clinics/:id` | No | — | Clinics |
| 27 | GET | `/admin/clinics` | Yes | `MANAGE_CLINICS` | Clinics |
| 28 | GET | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` | Clinics |
| 29 | POST | `/admin/clinics` | Yes | `MANAGE_CLINICS` | Clinics |
| 30 | PATCH | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` | Clinics |
| 31 | DELETE | `/admin/clinics/:id` | Yes | `MANAGE_CLINICS` | Clinics |
| 32 | GET | `/specialties` | No | — | Specialties |
| 33 | GET | `/specialties/:id` | No | — | Specialties |
| 34 | GET | `/admin/specialties` | Yes | `MANAGE_SPECIALTIES` | Specialties |
| 35 | GET | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` | Specialties |
| 36 | POST | `/admin/specialties` | Yes | `MANAGE_SPECIALTIES` | Specialties |
| 37 | PATCH | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` | Specialties |
| 38 | DELETE | `/admin/specialties/:id` | Yes | `MANAGE_SPECIALTIES` | Specialties |
| 39 | GET | `/doctor-schedules/me` | Yes | `VIEW_OWN_SCHEDULE` | Schedules |
| 40 | GET | `/doctor-schedules` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 41 | GET | `/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 42 | GET | `/doctor-schedules/doctor/:doctorId` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 43 | POST | `/doctor-schedules` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 44 | PATCH | `/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 45 | DELETE | `/doctor-schedules/:id` | Yes | `MANAGE_SCHEDULES` | Schedules |
| 46 | GET | `/appointment-slots/available` | No | — | Slots |
| 47 | GET | `/appointment-slots/doctor/:doctorId` | No | — | Slots |
| 48 | GET | `/appointment-slots/date/:slotDate` | No | — | Slots |
| 49 | GET | `/admin/appointment-slots` | Yes | `MANAGE_SLOTS` | Slots |
| 50 | GET | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` | Slots |
| 51 | GET | `/admin/appointment-slots/available` | Yes | `MANAGE_SLOTS` | Slots |
| 52 | GET | `/admin/appointment-slots/doctor/:doctorId` | Yes | `MANAGE_SLOTS` | Slots |
| 53 | GET | `/admin/appointment-slots/date/:slotDate` | Yes | `MANAGE_SLOTS` | Slots |
| 54 | POST | `/admin/appointment-slots` | Yes | `MANAGE_SLOTS` | Slots |
| 55 | PATCH | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` | Slots |
| 56 | DELETE | `/admin/appointment-slots/:id` | Yes | `MANAGE_SLOTS` | Slots |
| 57 | POST | `/appointments` | Yes | `BOOK_APPOINTMENT` / `MANAGE_OWN_APPOINTMENTS` | Appointments |
| 58 | GET | `/appointments/mine` | Yes | `MANAGE_OWN_APPOINTMENTS` | Appointments |
| 59 | PATCH | `/appointments/mine/:id` | Yes | `MANAGE_OWN_APPOINTMENTS` | Appointments |
| 60 | GET | `/appointments` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 61 | GET | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 62 | GET | `/appointments/patient/:patientId` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 63 | GET | `/appointments/doctor/:doctorId` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 64 | PATCH | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 65 | DELETE | `/appointments/:id` | Yes | `MANAGE_APPOINTMENTS` | Appointments |
| 66 | POST | `/payments` | Yes | `PAY_APPOINTMENT` / `MANAGE_PAYMENTS` | Payments |
| 67 | GET | `/payments/mine` | Yes | `PAY_APPOINTMENT` | Payments |
| 68 | GET | `/payments` | Yes | `MANAGE_PAYMENTS` | Payments |
| 69 | GET | `/payments/:id` | Yes | `MANAGE_PAYMENTS` | Payments |
| 70 | GET | `/payments/appointment/:appointmentId` | Yes | `MANAGE_PAYMENTS` | Payments |
| 71 | PATCH | `/payments/:id` | Yes | `MANAGE_PAYMENTS` | Payments |
| 72 | DELETE | `/payments/:id` | Yes | `MANAGE_PAYMENTS` | Payments |
| 73 | POST | `/reviews` | Yes | `MANAGE_OWN_REVIEWS` | Reviews |
| 74 | GET | `/reviews/mine` | Yes | `MANAGE_OWN_REVIEWS` / `VIEW_OWN_REVIEWS` | Reviews |
| 75 | GET | `/reviews` | Yes | `MANAGE_REVIEWS` | Reviews |
| 76 | GET | `/reviews/:id` | Yes | `MANAGE_REVIEWS` | Reviews |
| 77 | GET | `/reviews/appointment/:appointmentId` | Yes | `MANAGE_REVIEWS` | Reviews |
| 78 | PATCH | `/reviews/:id` | Yes | `MANAGE_REVIEWS` | Reviews |
| 79 | DELETE | `/reviews/:id` | Yes | `MANAGE_REVIEWS` | Reviews |

**Total: 79 endpoints** across 11 modules (auth, users, patients, doctors, clinics, specialties, doctor-schedules, appointment-slots, appointments, payments, reviews)
