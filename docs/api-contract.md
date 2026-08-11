# HealthFlow Clinic Booking System — API Contract

**Base URL:** `/api/v1`  
**Protocol:** HTTP/JSON  
**Tech Stack:** Node.js 22, Express 5, TypeScript, PostgreSQL 17, Zod 4, JWT, bcrypt  
**Date:** 2026-07-25

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Global Response Format](#2-global-response-format)
3. [Global Error Format](#3-global-error-format)
4. [Enumerations](#4-enumerations)
5. [Date Format](#5-date-format)
6. [UUID Format](#6-uuid-format)
7. [Pagination Contract](#7-pagination-contract)
8. [Search Contract](#8-search-contract)
9. [Filtering Contract](#9-filtering-contract)
10. [Shared DTOs](#10-shared-dtos)
11. [Rate Limiting](#11-rate-limiting)
12. [Validation Rules](#12-validation-rules)
13. [Endpoints](#13-endpoints)

---

## 1. Authentication Flow

### Token Storage
- Access token and refresh token are returned as strings in the response body (not HTTP-only cookies).
- Client must store both tokens securely (e.g., `localStorage` or `httpOnly` cookie at the proxy level).

### Authorization Header
```
Authorization: Bearer <accessToken>
```

### Endpoints

#### POST /auth/register
Creates a new user account with role `patient`. Returns both access and refresh tokens.

#### POST /auth/login
Authenticates with email + password. Returns both tokens.

#### POST /auth/refresh
Accepts a valid refresh token, returns a new access + refresh token pair. Invalidates the old refresh token.

#### POST /auth/logout
Revokes the provided refresh token. Requires authentication.

#### GET /auth/me
Returns the currently authenticated user's profile. Requires authentication.

---

## 2. Global Response Format

### Success Response (Single Resource)
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Success Response (Paginated List)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "Optional message"
}
```

### No Content
- **Status:** `204`
- **Body:** Empty

---

## 3. Global Error Format

### Operational Errors (thrown by application)
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ ... ]
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "too_small",
      "expected": 1,
      "received": 0,
      "path": ["fullName"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### PostgreSQL Input Errors
Invalid UUIDs or malformed input produce:
```json
{
  "success": false,
  "message": "Invalid input format"
}
```

### Error Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request — Invalid input, validation failure, malformed UUID/date |
| 401 | Unauthorized — Missing, malformed, or expired token |
| 403 | Forbidden — Insufficient role/permissions |
| 404 | Resource not found |
| 409 | Conflict — Duplicate email/name/unique constraint violation |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
| 501 | Not Implemented |
| 503 | Service Unavailable |

---

## 4. Enumerations

### UserRole
| Value | Description |
|-------|-------------|
| `patient` | Default on register |
| `doctor` | Admin-assigned |
| `admin` | System administrator |

### SlotStatus
| Value | Description |
|-------|-------------|
| `available` | Free to book |
| `booked` | Occupied by an appointment |
| `cancelled` | No longer available |

### AppointmentStatus
| Value | Description |
|-------|-------------|
| `scheduled` | Default on creation |
| `confirmed` | Verified by clinic/doctor |
| `completed` | Appointment happened |
| `cancelled` | Cancelled by patient/doctor |
| `no_show` | Patient did not attend |

### PaymentMethod
| Value | Description |
|-------|-------------|
| `cash` | Pay at clinic |
| `card` | Credit/debit card |
| `bank_transfer` | Bank wire transfer |
| `online` | Online payment gateway |

### PaymentStatus
| Value | Description |
|-------|-------------|
| `pending` | Awaiting payment |
| `paid` | Completed successfully |
| `failed` | Payment declined/failed |
| `refunded` | Money returned |

### SortOrder
| Value | Description |
|-------|-------------|
| `asc` | Ascending |
| `desc` | Descending |

---

## 5. Date Format

- **Dates (YYYY-MM-DD):** `^\d{4}-\d{2}-\d{2}$` — e.g., `2026-07-25`
- **Times (HH:mm):** 24-hour format `^([01]\d|2[0-3]):[0-5]\d$` — e.g., `14:30`
- **Timestamps:** ISO 8601 with timezone — e.g., `2026-07-25T12:00:00.000Z`
- **Weekday:** Integer, `0` (Sunday) through `6` (Saturday)

---

## 6. UUID Format

All resource identifiers use **UUID v4** format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Generated server-side via PostgreSQL `gen_random_uuid()`.

---

## 7. Pagination Contract

### Defaults
| Parameter | Default | Maximum |
|-----------|---------|---------|
| `page` | `1` | — |
| `limit` | `20` | `100` |

### Request (query params)
```
GET /api/v1/resource?page=1&limit=20
```

Query parameters are coerced to integers via `z.coerce.number()`.

### Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 8. Search Contract

Search is supported on the Users module via a `search` query parameter that performs a LIKE/ILIKE match on the `email` column:

```
GET /api/v1/admin/users?search=john
```

---

## 9. Filtering Contract

Filtering is supported via query parameters. Only exact-match filters exist currently.

### Users
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | `UserRole` | Filter by role |
| `isVerified` | `boolean` | Filter by verification status |

---

## 10. Shared DTOs

### AuthenticatedUser (JWT payload on `req.user`)
```typescript
{
  sub: string;   // User UUID
  role: UserRole; // "patient" | "doctor" | "admin"
}
```

### AuthTokens
```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

### PaginationMeta
```typescript
{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### UserPublic
```typescript
{
  id: UUID;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

---

## 11. Rate Limiting

Rate limiting is **not yet implemented**. The `429 TOO_MANY_REQUESTS` status code is defined in `HttpStatus` but no middleware is wired.

---

## 12. Validation Rules

| Field | Rule |
|-------|------|
| email | Valid email format, max 255 |
| password | Min 8, max 128 (register); min 1 (login) |
| fullName | Min 1, max 255 |
| phone | Max 50 |
| gender | Max 20 |
| birthDate, slotDate | Regex: `^\d{4}-\d{2}-\d{2}$` |
| startTime, endTime | Regex: `^([01]\d|2[0-3]):[0-5]\d$` (HH:mm) |
| weekday | Integer, 0–6 |
| slotDuration | Integer, min 1 |
| consultationFee | Number, min 0 |
| experienceYears | Integer, min 0 |
| rating | Integer, 1–5 |
| notes, comment | Max 500 |
| transactionReference | Max 255 |
| role | Enum: `patient`, `doctor`, `admin` |
| status (slot) | Enum: `available`, `booked`, `cancelled` |
| status (appointment) | Enum: `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` |
| method | Enum: `cash`, `card`, `bank_transfer`, `online` |
| status (payment) | Enum: `pending`, `paid`, `failed`, `refunded` |
| userId, clinicId, specialtyId, doctorId, etc. | UUID v4 |
| amount | Positive number |
| endTime > startTime | Cross-field refinement |
| name (specialty) | Min 2, max 255, trimmed |
| name (clinic) | Min 1, max 255 |
| isVerified | Coerced boolean |
| page, limit | Coerced positive integer, max 100 |

---

## 13. Endpoints

---

### Authentication

#### 13.1 Register

| Property | Value |
|----------|-------|
| **Feature** | User Registration |
| **Method** | `POST` |
| **Route** | `/auth/register` |
| **Description** | Creates a new patient user account and returns JWT tokens |
| **Auth required** | No |
| **Required Role(s)** | None |

**Headers:**
| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

**Request Body:**
```json
{
  "email": "string (email, required)",
  "password": "string (min 8, max 128, required)",
  "fullName": "string (min 1, max 255, required)"
}
```

**Response Body (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  },
  "message": "User registered successfully"
}
```

**Error Codes:** `400`, `409` (duplicate email)

---

#### 13.2 Login

| Property | Value |
|----------|-------|
| **Feature** | User Login |
| **Method** | `POST` |
| **Route** | `/auth/login` |
| **Description** | Authenticates with email/password, returns JWT tokens |
| **Auth required** | No |
| **Required Role(s)** | None |

**Request Body:**
```json
{
  "email": "string (email, required)",
  "password": "string (min 1, required)"
}
```

**Response Body (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Error Codes:** `400`, `401`

---

#### 13.3 Refresh Token

| Property | Value |
|----------|-------|
| **Feature** | Token Refresh |
| **Method** | `POST` |
| **Route** | `/auth/refresh` |
| **Description** | Exchanges a valid refresh token for a new token pair |
| **Auth required** | No |
| **Required Role(s)** | None |

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response Body (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**Error Codes:** `400`, `401`

---

#### 13.4 Logout

| Property | Value |
|----------|-------|
| **Feature** | Logout |
| **Method** | `POST` |
| **Route** | `/auth/logout` |
| **Description** | Revokes the provided refresh token |
| **Auth required** | Yes |
| **Required Role(s)** | Any authenticated user |

**Headers:**
| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response:** `204 No Content`

**Error Codes:** `400`, `401`

---

#### 13.5 Get Current User

| Property | Value |
|----------|-------|
| **Feature** | Get Current User |
| **Method** | `GET` |
| **Route** | `/auth/me` |
| **Description** | Returns the authenticated user's public profile |
| **Auth required** | Yes |
| **Required Role(s)** | Any authenticated user |

**Headers:**
| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <accessToken>` |

**Response Body (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "role": "patient | doctor | admin",
    "isVerified": false,
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp",
    "deletedAt": null
  }
}
```

**Error Codes:** `401`

---

### Users (Admin)

#### 13.6 List Users

| Property | Value |
|----------|-------|
| **Feature** | List Users |
| **Method** | `GET` |
| **Route** | `/admin/users` |
| **Description** | Paginated list of all users with filtering and search |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_USERS) |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | int | No | Page number (default 1) |
| `limit` | int | No | Items per page (default 20, max 100) |
| `role` | UserRole | No | Filter by role |
| `isVerified` | bool | No | Filter by verification status |
| `search` | string | No | Search by email |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "role": "patient | doctor | admin",
      "isVerified": false,
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp",
      "deletedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

**Error Codes:** `401`, `403`

---

#### 13.7 Get User by ID

| Property | Value |
|----------|-------|
| **Feature** | Get User |
| **Method** | `GET` |
| **Route** | `/admin/users/:id` |
| **Description** | Returns a single user by UUID |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_USERS) |

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |

**Response Body (200):** Single `UserPublic` object.

**Error Codes:** `401`, `403`, `404`

---

#### 13.8 Update User

| Property | Value |
|----------|-------|
| **Feature** | Update User |
| **Method** | `PATCH` |
| **Route** | `/admin/users/:id` |
| **Description** | Updates user email, role, or verification status |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_USERS) |

**Path Parameters:** `id` (UUID)

**Request Body:**
```json
{
  "email": "string (email, optional)",
  "role": "patient | doctor | admin (optional)",
  "isVerified": true
}
```

**Response Body (200):** Updated `UserPublic` object.

**Error Codes:** `400`, `401`, `403`, `404`, `409`

---

#### 13.9 Soft Delete User

| Property | Value |
|----------|-------|
| **Feature** | Soft Delete User |
| **Method** | `DELETE` |
| **Route** | `/admin/users/:id` |
| **Description** | Sets `deleted_at` timestamp (soft delete) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_USERS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`

---

### Clinics

#### 13.10 List Clinics (Public)

| Property | Value |
|----------|-------|
| **Feature** | List Clinics |
| **Method** | `GET` |
| **Route** | `/clinics` |
| **Description** | Returns all clinics (public) |
| **Auth required** | No |
| **Required Role(s)** | None |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "phone": "string | null",
      "address": "string | null",
      "city": "string | null",
      "description": "string | null",
      "doctorsCount": "number"
    }
  ]
}
```

**Error Codes:** None

---

#### 13.11 Get Clinic by ID (Public)

| Property | Value |
|----------|-------|
| **Feature** | Get Clinic |
| **Method** | `GET` |
| **Route** | `/clinics/:id` |
| **Description** | Returns a single clinic (public) |
| **Auth required** | No |
| **Required Role(s)** | None |

**Path Parameters:** `id` (UUID)

**Error Codes:** `404`

---

#### 13.12 Create Clinic (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Create Clinic |
| **Method** | `POST` |
| **Route** | `/admin/clinics` |
| **Description** | Creates a new clinic |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_CLINICS) |

**Request Body:**
```json
{
  "name": "string (min 1, max 255, required)",
  "phone": "string (max 50, nullable, optional)",
  "address": "string (nullable, optional)",
  "city": "string (max 100, nullable, optional)",
  "description": "string (nullable, optional)"
}
```

**Response Body (201):** Created `ClinicRecord`.

**Error Codes:** `400`, `401`, `403`

---

#### 13.13 Update Clinic (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Clinic |
| **Method** | `PATCH` |
| **Route** | `/admin/clinics/:id` |
| **Description** | Updates clinic fields |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_CLINICS) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields as create, all optional.

**Response Body (200):** Updated `ClinicRecord`.

**Error Codes:** `400`, `401`, `403`, `404`

---

#### 13.14 Delete Clinic (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Clinic |
| **Method** | `DELETE` |
| **Route** | `/admin/clinics/:id` |
| **Description** | Hard deletes a clinic (fails if doctors reference it) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_CLINICS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`, `409`

---

### Specialties

#### 13.15 List Specialties (Public)

| Property | Value |
|----------|-------|
| **Feature** | List Specialties |
| **Method** | `GET` |
| **Route** | `/specialties` |
| **Description** | Returns all medical specialties |
| **Auth required** | No |
| **Required Role(s)** | None |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string"
    }
  ]
}
```

---

#### 13.16 Get Specialty by ID (Public)

| Property | Value |
|----------|-------|
| **Feature** | Get Specialty |
| **Method** | `GET` |
| **Route** | `/specialties/:id` |
| **Description** | Returns a single specialty |
| **Auth required** | No |
| **Required Role(s)** | None |

**Path Parameters:** `id` (UUID)

**Error Codes:** `404`

---

#### 13.17 Create Specialty (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Create Specialty |
| **Method** | `POST` |
| **Route** | `/admin/specialties` |
| **Description** | Creates a new medical specialty |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SPECIALTIES) |

**Request Body:**
```json
{
  "name": "string (trimmed, min 2, max 255, required)"
}
```

**Response Body (201):** Created `SpecialtyRecord`.

**Error Codes:** `400`, `401`, `403`, `409`

---

#### 13.18 Update Specialty (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Specialty |
| **Method** | `PATCH` |
| **Route** | `/admin/specialties/:id` |
| **Description** | Updates a specialty name |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SPECIALTIES) |

**Path Parameters:** `id` (UUID)

**Request Body:**
```json
{
  "name": "string (trimmed, min 2, max 255, optional)"
}
```

**Response Body (200):** Updated `SpecialtyRecord`.

**Error Codes:** `400`, `401`, `403`, `404`, `409`

---

#### 13.19 Delete Specialty (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Specialty |
| **Method** | `DELETE` |
| **Route** | `/admin/specialties/:id` |
| **Description** | Hard deletes a specialty (fails if doctors reference it) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SPECIALTIES) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`, `409`

---

### Doctors

#### 13.20 List Doctors (Public)

| Property | Value |
|----------|-------|
| **Feature** | List Doctors |
| **Method** | `GET` |
| **Route** | `/doctors` |
| **Description** | Returns all doctors |
| **Auth required** | No |
| **Required Role(s)** | None |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "clinicId": "uuid",
      "specialtyId": "uuid",
      "consultationFee": "string (numeric)",
      "bio": "string | null",
      "experienceYears": 0
    }
  ]
}
```

---

#### 13.21 Get Doctor by ID (Public)

| Property | Value |
|----------|-------|
| **Feature** | Get Doctor |
| **Method** | `GET` |
| **Route** | `/doctors/:id` |
| **Description** | Returns a single doctor |
| **Auth required** | No |
| **Required Role(s)** | None |

**Path Parameters:** `id` (UUID)

**Error Codes:** `404`

---

#### 13.22 Get My Doctor Profile

| Property | Value |
|----------|-------|
| **Feature** | Get My Profile |
| **Method** | `GET` |
| **Route** | `/doctors/me` |
| **Description** | Returns the authenticated doctor's profile |
| **Auth required** | Yes |
| **Required Role(s)** | `doctor` (VIEW_OWN_PROFILE) |

**Response Body (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "clinicId": "uuid",
    "specialtyId": "uuid",
    "consultationFee": "string (numeric)",
    "bio": "string | null",
    "experienceYears": 0,
    "doctor": {
      "id": "uuid",
      "displayName": "string",
      "clinicName": "string",
      "specialtyName": "string"
    }
  }
}
```

**Error Codes:** `404` (no doctor profile for this user)

---

#### 13.23 Update My Doctor Profile

| Property | Value |
|----------|-------|
| **Feature** | Update My Profile |
| **Method** | `PATCH` |
| **Route** | `/doctors/me` |
| **Description** | Updates the authenticated doctor's profile |
| **Auth required** | Yes |
| **Required Role(s)** | `doctor` (MANAGE_OWN_PROFILE) |

**Request Body:**
```json
{
  "fullName": "string (min 1, max 255, optional)",
  "consultationFee": "number (>= 0, optional)",
  "bio": "string (nullable, optional)",
  "experienceYears": "integer (>= 0, optional)"
}
```

**Response Body (200):** Updated doctor read model (same shape as 13.22).

**Error Codes:** `400`, `401`, `403`, `404`

---

#### 13.24 Create Doctor (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Create Doctor |
| **Method** | `POST` |
| **Route** | `/admin/doctors` |
| **Description** | Creates a new doctor profile (user must exist) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_DOCTORS) |

**Request Body:**
```json
{
  "userId": "uuid (required)",
  "clinicId": "uuid (required)",
  "specialtyId": "uuid (required)",
  "consultationFee": 0.00,
  "bio": "string (nullable, optional)",
  "experienceYears": 0
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `userId` | UUID, unique per doctor |
| `clinicId` | UUID, must reference existing clinic |
| `specialtyId` | UUID, must reference existing specialty |
| `consultationFee` | Number, >= 0 |
| `experienceYears` | Integer, >= 0 |

**Response Body (201):** Created `DoctorRecord`.

**Error Codes:** `400`, `401`, `403`, `409` (duplicate user)

---

#### 13.25 Update Doctor (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Doctor |
| **Method** | `PATCH` |
| **Route** | `/admin/doctors/:id` |
| **Description** | Updates doctor fields |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_DOCTORS) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields as create, all optional.

**Response Body (200):** Updated `DoctorRecord`.

**Error Codes:** `400`, `401`, `403`, `404`

---

#### 13.26 Delete Doctor (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Doctor |
| **Method** | `DELETE` |
| **Route** | `/admin/doctors/:id` |
| **Description** | Hard deletes a doctor (cascades to schedules/slots) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_DOCTORS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`

---

### Doctor Schedules

#### 13.27 Get My Schedule (Doctor)

| Property | Value |
|----------|-------|
| **Feature** | Get My Schedule |
| **Method** | `GET` |
| **Route** | `/doctor-schedules/me` |
| **Description** | Returns the authenticated doctor's schedule entries |
| **Auth required** | Yes |
| **Required Role(s)** | `doctor` (VIEW_OWN_SCHEDULE) |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "weekday": 0,
      "startTime": "09:00",
      "endTime": "17:00",
      "slotDuration": 30
    }
  ]
}
```

**Error Codes:** `401`, `403`

---

#### 13.28 Get Schedule by Doctor ID

| Property | Value |
|----------|-------|
| **Feature** | Get Doctor Schedule |
| **Method** | `GET` |
| **Route** | `/doctor-schedules/doctor/:doctorId` |
| **Description** | Returns schedules for a specific doctor |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Path Parameters:** `doctorId` (UUID)

**Error Codes:** `401`, `403`, `404`

---

#### 13.29 List All Schedules

| Property | Value |
|----------|-------|
| **Feature** | List Schedules |
| **Method** | `GET` |
| **Route** | `/doctor-schedules` |
| **Description** | Returns all doctor schedules |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Error Codes:** `401`, `403`

---

#### 13.30 Get Schedule by ID

| Property | Value |
|----------|-------|
| **Feature** | Get Schedule |
| **Method** | `GET` |
| **Route** | `/doctor-schedules/:id` |
| **Description** | Returns a single schedule entry |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Path Parameters:** `id` (UUID)

**Error Codes:** `401`, `403`, `404`

---

#### 13.31 Create Schedule

| Property | Value |
|----------|-------|
| **Feature** | Create Schedule |
| **Method** | `POST` |
| **Route** | `/doctor-schedules` |
| **Description** | Creates a recurring weekly schedule for a doctor |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Request Body:**
```json
{
  "doctorId": "uuid (required)",
  "weekday": 0,
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 30
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `doctorId` | UUID |
| `weekday` | Integer, 0–6 |
| `startTime` | HH:mm format |
| `endTime` | HH:mm format, must be > startTime |
| `slotDuration` | Integer, >= 1 (minutes) |

**Response Body (201):** Created `DoctorScheduleRecord`.

**Error Codes:** `400`, `401`, `403`, `409` (duplicate doctor+weekday+startTime)

---

#### 13.32 Update Schedule

| Property | Value |
|----------|-------|
| **Feature** | Update Schedule |
| **Method** | `PATCH` |
| **Route** | `/doctor-schedules/:id` |
| **Description** | Updates schedule fields |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields as create, all optional (endTime must be after startTime if both provided).

**Response Body (200):** Updated `DoctorScheduleRecord`.

**Error Codes:** `400`, `401`, `403`, `404`

---

#### 13.33 Delete Schedule

| Property | Value |
|----------|-------|
| **Feature** | Delete Schedule |
| **Method** | `DELETE` |
| **Route** | `/doctor-schedules/:id` |
| **Description** | Deletes a schedule entry (cascades to slots) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SCHEDULES) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`

---

### Appointment Slots

#### 13.34 Find Available Slots

| Property | Value |
|----------|-------|
| **Feature** | Find Available Slots |
| **Method** | `GET` |
| **Route** | `/appointment-slots/available` |
| **Description** | Queries available slots with optional filters |
| **Auth required** | No |
| **Required Role(s)** | None |

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `doctorId` | UUID | No | Filter by doctor |
| `date` | string (YYYY-MM-DD) | No | Filter by date |
| `available` | string | No | Filter parameter (passthrough to service) |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "doctorId": "uuid",
      "doctorScheduleId": "uuid",
      "slotDate": "2026-07-25",
      "startTime": "09:00",
      "endTime": "09:30",
      "status": "available",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp",
      "deletedAt": null
    }
  ]
}
```

---

#### 13.35 Get Slots by Doctor

| Property | Value |
|----------|-------|
| **Feature** | Get Slots by Doctor |
| **Method** | `GET` |
| **Route** | `/appointment-slots/doctor/:doctorId` |
| **Description** | Returns all slots for a specific doctor |
| **Auth required** | No |
| **Required Role(s)** | None |

**Path Parameters:** `doctorId` (UUID)

---

#### 13.36 Get Slots by Date

| Property | Value |
|----------|-------|
| **Feature** | Get Slots by Date |
| **Method** | `GET` |
| **Route** | `/appointment-slots/date/:slotDate` |
| **Description** | Returns all slots for a specific date |
| **Auth required** | No |
| **Required Role(s)** | None |

**Path Parameters:** `slotDate` (YYYY-MM-DD)

---

#### 13.37 List All Slots (Admin)

| Property | Value |
|----------|-------|
| **Feature** | List All Slots |
| **Method** | `GET` |
| **Route** | `/admin/appointment-slots` |
| **Description** | Returns all appointment slots |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SLOTS) |

---

#### 13.38 Get Slot by ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Slot |
| **Method** | `GET` |
| **Route** | `/admin/appointment-slots/:id` |
| **Description** | Returns a single slot |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SLOTS) |

**Path Parameters:** `id` (UUID)

---

#### 13.39 Create Slot (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Create Slot |
| **Method** | `POST` |
| **Route** | `/admin/appointment-slots` |
| **Description** | Creates a new appointment slot |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SLOTS) |

**Request Body:**
```json
{
  "doctorId": "uuid (required)",
  "doctorScheduleId": "uuid (required)",
  "slotDate": "2026-07-25",
  "startTime": "09:00",
  "endTime": "09:30",
  "status": "available"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `doctorId` | UUID |
| `doctorScheduleId` | UUID |
| `slotDate` | YYYY-MM-DD |
| `startTime` | HH:mm |
| `endTime` | HH:mm, must be > startTime |
| `status` | Optional, defaults to `available`; enum: `available`, `booked`, `cancelled` |

**Response Body (201):** Created `AppointmentSlotRecord`.

**Error Codes:** `400`, `401`, `403`, `409` (duplicate doctor+date+startTime)

---

#### 13.40 Update Slot (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Slot |
| **Method** | `PATCH` |
| **Route** | `/admin/appointment-slots/:id` |
| **Description** | Updates slot fields |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SLOTS) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields, all optional (endTime must be after startTime if both provided).

**Response Body (200):** Updated `AppointmentSlotRecord`.

**Error Codes:** `400`, `401`, `403`, `404`

---

#### 13.41 Delete Slot (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Slot |
| **Method** | `DELETE` |
| **Route** | `/admin/appointment-slots/:id` |
| **Description** | Soft deletes a slot (sets deleted_at) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_SLOTS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

**Error Codes:** `401`, `403`, `404`

---

### Appointments

#### 13.42 Book Appointment (Self)

| Property | Value |
|----------|-------|
| **Feature** | Book Appointment |
| **Method** | `POST` |
| **Route** | `/appointments` |
| **Description** | Patient books an appointment for themselves |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (BOOK_APPOINTMENT) or `admin` (MANAGE_OWN_APPOINTMENTS) |

**Request Body:**
```json
{
  "slotId": "uuid (required)"
}
```

**Response Body (201):**
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

**Error Codes:** `400`, `401`, `403`, `404`, `409` (slot already booked)

---

#### 13.43 Get My Appointments

| Property | Value |
|----------|-------|
| **Feature** | Get My Appointments |
| **Method** | `GET` |
| **Route** | `/appointments/mine` |
| **Description** | Returns the current user's appointments (patient sees own, doctor sees their patients') |
| **Auth required** | Yes |
| **Required Role(s)** | `patient`, `doctor`, or `admin` (MANAGE_OWN_APPOINTMENTS) |

**Error Codes:** `401`, `403`

---

#### 13.44 Cancel My Appointment

| Property | Value |
|----------|-------|
| **Feature** | Cancel My Appointment |
| **Method** | `PATCH` |
| **Route** | `/appointments/mine/:id` |
| **Description** | Patient or doctor cancels their own appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` or `doctor` (MANAGE_OWN_APPOINTMENTS) |

**Path Parameters:** `id` (UUID)

**Response Body (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Appointment cancelled successfully"
}
```

**Error Codes:** `401`, `403`, `404`

---

#### 13.45 Get Appointments by Patient (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Appointments by Patient |
| **Method** | `GET` |
| **Route** | `/appointments/patient/:patientId` |
| **Description** | Returns all appointments for a patient |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

**Path Parameters:** `patientId` (UUID)

---

#### 13.46 Get Appointments by Doctor (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Appointments by Doctor |
| **Method** | `GET` |
| **Route** | `/appointments/doctor/:doctorId` |
| **Description** | Returns all appointments for a doctor |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

**Path Parameters:** `doctorId` (UUID)

---

#### 13.47 List All Appointments (Admin)

| Property | Value |
|----------|-------|
| **Feature** | List All Appointments |
| **Method** | `GET` |
| **Route** | `/appointments` |
| **Description** | Returns all appointments |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

---

#### 13.48 Get Appointment by ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Appointment |
| **Method** | `GET` |
| **Route** | `/appointments/:id` |
| **Description** | Returns a single appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

**Path Parameters:** `id` (UUID)

---

#### 13.49 Update Appointment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Appointment |
| **Method** | `PATCH` |
| **Route** | `/appointments/:id` |
| **Description** | Updates appointment status or notes |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

**Path Parameters:** `id` (UUID)

**Request Body:**
```json
{
  "status": "scheduled | confirmed | completed | cancelled | no_show (optional)",
  "notes": "string (max 500, nullable, optional)"
}
```

**Response Body (200):** Updated `AppointmentRecord`.

---

#### 13.50 Delete Appointment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Appointment |
| **Method** | `DELETE` |
| **Route** | `/appointments/:id` |
| **Description** | Deletes an appointment (fails if payment exists) |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_APPOINTMENTS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

---

### Patients

#### 13.51 Get My Patient Profile

| Property | Value |
|----------|-------|
| **Feature** | Get My Profile |
| **Method** | `GET` |
| **Route** | `/patients/me` |
| **Description** | Returns the authenticated patient's profile |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (VIEW_OWN_PROFILE) |

**Response Body (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "string",
    "phone": "string | null",
    "gender": "string | null",
    "birthDate": "YYYY-MM-DD | null"
  }
}
```

---

#### 13.52 Update My Patient Profile

| Property | Value |
|----------|-------|
| **Feature** | Update My Profile |
| **Method** | `PATCH` |
| **Route** | `/patients/me` |
| **Description** | Updates the authenticated patient's profile |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (MANAGE_OWN_PROFILE) |

**Request Body:**
```json
{
  "fullName": "string (min 1, max 255, optional)",
  "phone": "string (max 50, nullable, optional)",
  "gender": "string (max 20, nullable, optional)",
  "birthDate": "YYYY-MM-DD (nullable, optional)"
}
```

**Response Body (200):** Updated `PatientRecord`.

---

#### 13.53 Create Patient (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Create Patient |
| **Method** | `POST` |
| **Route** | `/patients` |
| **Description** | Creates a patient profile for an existing user |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

**Request Body:**
```json
{
  "userId": "uuid (required)",
  "fullName": "string (min 1, max 255, required)",
  "phone": "string (max 50, nullable, optional)",
  "gender": "string (max 20, nullable, optional)",
  "birthDate": "YYYY-MM-DD (nullable, optional)"
}
```

**Response Body (201):** Created `PatientRecord`.

---

#### 13.54 Get Patient by User ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Patient by User |
| **Method** | `GET` |
| **Route** | `/patients/user/:userId` |
| **Description** | Returns patient profile linked to a user |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

**Path Parameters:** `userId` (UUID)

---

#### 13.55 Update Patient (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Patient |
| **Method** | `PATCH` |
| **Route** | `/patients/:id` |
| **Description** | Updates any patient profile |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields as create, all optional.

---

#### 13.56 List All Patients (Admin)

| Property | Value |
|----------|-------|
| **Feature** | List Patients |
| **Method** | `GET` |
| **Route** | `/patients` |
| **Description** | Returns all patient profiles |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

---

#### 13.57 Get Patient by ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Patient |
| **Method** | `GET` |
| **Route** | `/patients/:id` |
| **Description** | Returns a single patient profile |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

**Path Parameters:** `id` (UUID)

---

#### 13.58 Delete Patient (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Patient |
| **Method** | `DELETE` |
| **Route** | `/patients/:id` |
| **Description** | Hard deletes a patient profile |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PATIENTS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

---

### Payments

#### 13.59 Create Payment (Self)

| Property | Value |
|----------|-------|
| **Feature** | Create Payment |
| **Method** | `POST` |
| **Route** | `/payments` |
| **Description** | Patient creates a payment for their appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (PAY_APPOINTMENT) or `admin` (MANAGE_PAYMENTS) |

**Request Body:**
```json
{
  "appointmentId": "uuid (required)",
  "amount": 150.00,
  "method": "cash | card | bank_transfer | online",
  "status": "pending (optional)",
  "transactionReference": "string (max 255, nullable, optional)"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `appointmentId` | UUID, must reference existing appointment |
| `amount` | Positive number (> 0) |
| `method` | Enum: cash, card, bank_transfer, online |
| `status` | Optional, defaults to `pending`; enum: pending, paid, failed, refunded |

**Response Body (201):** Created `PaymentRecord`.

**Error Codes:** `400`, `401`, `403`, `404`, `409` (appointment already has payment)

---

#### 13.60 Get My Payments

| Property | Value |
|----------|-------|
| **Feature** | Get My Payments |
| **Method** | `GET` |
| **Route** | `/payments/mine` |
| **Description** | Returns the authenticated patient's payments |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (PAY_APPOINTMENT) |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "amount": 150.00,
      "method": "cash",
      "status": "pending",
      "transactionReference": null
    }
  ]
}
```

---

#### 13.61 Get Payment by Appointment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Payment by Appointment |
| **Method** | `GET` |
| **Route** | `/payments/appointment/:appointmentId` |
| **Description** | Returns payment for a specific appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PAYMENTS) |

**Path Parameters:** `appointmentId` (UUID)

---

#### 13.62 List All Payments (Admin)

| Property | Value |
|----------|-------|
| **Feature** | List Payments |
| **Method** | `GET` |
| **Route** | `/payments` |
| **Description** | Returns all payments |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PAYMENTS) |

---

#### 13.63 Get Payment by ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Payment |
| **Method** | `GET` |
| **Route** | `/payments/:id` |
| **Description** | Returns a single payment |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PAYMENTS) |

**Path Parameters:** `id` (UUID)

---

#### 13.64 Update Payment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Payment |
| **Method** | `PATCH` |
| **Route** | `/payments/:id` |
| **Description** | Updates payment fields |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PAYMENTS) |

**Path Parameters:** `id` (UUID)

**Request Body:** Same fields as create, all optional.

**Response Body (200):** Updated `PaymentRecord`.

---

#### 13.65 Delete Payment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Payment |
| **Method** | `DELETE` |
| **Route** | `/payments/:id` |
| **Description** | Deletes a payment record |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_PAYMENTS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

---

### Reviews

#### 13.66 Create Review (Self)

| Property | Value |
|----------|-------|
| **Feature** | Create Review |
| **Method** | `POST` |
| **Route** | `/reviews` |
| **Description** | Patient creates a review for their completed appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (MANAGE_OWN_REVIEWS) |

**Request Body:**
```json
{
  "appointmentId": "uuid (required)",
  "rating": 5,
  "comment": "string (max 500, nullable, optional)"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| `appointmentId` | UUID, must reference existing appointment |
| `rating` | Integer, 1–5 |
| `comment` | Max 500, nullable |

**Response Body (201):** Created `ReviewRecord`.

**Error Codes:** `400`, `401`, `403`, `404`, `409` (appointment already reviewed)

---

#### 13.67 Get My Reviews

| Property | Value |
|----------|-------|
| **Feature** | Get My Reviews |
| **Method** | `GET` |
| **Route** | `/reviews/mine` |
| **Description** | Returns the current user's reviews (patient sees own, doctor sees reviews of their patients) |
| **Auth required** | Yes |
| **Required Role(s)** | `patient` (MANAGE_OWN_REVIEWS) or `doctor` (VIEW_OWN_REVIEWS) |

**Response Body (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "rating": 5,
      "comment": "Great service!"
    }
  ]
}
```

---

#### 13.68 Get Review by Appointment (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Review by Appointment |
| **Method** | `GET` |
| **Route** | `/reviews/appointment/:appointmentId` |
| **Description** | Returns the review for a specific appointment |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_REVIEWS) |

**Path Parameters:** `appointmentId` (UUID)

---

#### 13.69 List All Reviews (Admin)

| Property | Value |
|----------|-------|
| **Feature** | List Reviews |
| **Method** | `GET` |
| **Route** | `/reviews` |
| **Description** | Returns all reviews |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_REVIEWS) |

---

#### 13.70 Get Review by ID (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Get Review |
| **Method** | `GET` |
| **Route** | `/reviews/:id` |
| **Description** | Returns a single review |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_REVIEWS) |

**Path Parameters:** `id` (UUID)

---

#### 13.71 Update Review (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Update Review |
| **Method** | `PATCH` |
| **Route** | `/reviews/:id` |
| **Description** | Updates review rating or comment |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_REVIEWS) |

**Path Parameters:** `id` (UUID)

**Request Body:**
```json
{
  "rating": 4,
  "comment": "string (max 500, nullable, optional)"
}
```

**Response Body (200):** Updated `ReviewRecord`.

---

#### 13.72 Delete Review (Admin)

| Property | Value |
|----------|-------|
| **Feature** | Delete Review |
| **Method** | `DELETE` |
| **Route** | `/reviews/:id` |
| **Description** | Deletes a review |
| **Auth required** | Yes |
| **Required Role(s)** | `admin` (MANAGE_REVIEWS) |

**Path Parameters:** `id` (UUID)

**Response:** `204 No Content`

---

## Endpoints Summary

### Public Endpoints (No Auth)
| # | Method | Route |
|---|--------|-------|
| 13.1 | POST | `/auth/register` |
| 13.2 | POST | `/auth/login` |
| 13.3 | POST | `/auth/refresh` |
| 13.10 | GET | `/clinics` |
| 13.11 | GET | `/clinics/:id` |
| 13.15 | GET | `/specialties` |
| 13.16 | GET | `/specialties/:id` |
| 13.20 | GET | `/doctors` |
| 13.21 | GET | `/doctors/:id` |
| 13.34 | GET | `/appointment-slots/available` |
| 13.35 | GET | `/appointment-slots/doctor/:doctorId` |
| 13.36 | GET | `/appointment-slots/date/:slotDate` |

### Patient Endpoints (Auth + Patient Role)
| # | Method | Route |
|---|--------|-------|
| 13.42 | POST | `/appointments` |
| 13.43 | GET | `/appointments/mine` |
| 13.44 | PATCH | `/appointments/mine/:id` |
| 13.51 | GET | `/patients/me` |
| 13.52 | PATCH | `/patients/me` |
| 13.59 | POST | `/payments` |
| 13.60 | GET | `/payments/mine` |
| 13.66 | POST | `/reviews` |
| 13.67 | GET | `/reviews/mine` |

### Doctor Endpoints (Auth + Doctor Role)
| # | Method | Route |
|---|--------|-------|
| 13.22 | GET | `/doctors/me` |
| 13.23 | PATCH | `/doctors/me` |
| 13.27 | GET | `/doctor-schedules/me` |
| 13.43 | GET | `/appointments/mine` |
| 13.44 | PATCH | `/appointments/mine/:id` |
| 13.67 | GET | `/reviews/mine` |

### Admin Endpoints (Auth + Admin Role)
| # | Method | Route |
|---|--------|-------|
| 13.6 | GET | `/admin/users` |
| 13.7 | GET | `/admin/users/:id` |
| 13.8 | PATCH | `/admin/users/:id` |
| 13.9 | DELETE | `/admin/users/:id` |
| 13.12 | POST | `/admin/clinics` |
| 13.13 | PATCH | `/admin/clinics/:id` |
| 13.14 | DELETE | `/admin/clinics/:id` |
| 13.17 | POST | `/admin/specialties` |
| 13.18 | PATCH | `/admin/specialties/:id` |
| 13.19 | DELETE | `/admin/specialties/:id` |
| 13.24 | POST | `/admin/doctors` |
| 13.25 | PATCH | `/admin/doctors/:id` |
| 13.26 | DELETE | `/admin/doctors/:id` |
| 13.28–33 | All | `/doctor-schedules/*`, `/doctor-schedules/doctor/:doctorId` |
| 13.37–41 | All | `/admin/appointment-slots/*` |
| 13.45–50 | All | `/appointments/*` (admin-scoped) |
| 13.53–58 | All | `/patients/*` (admin-scoped) |
| 13.61–65 | All | `/payments/*` (admin-scoped) |
| 13.68–72 | All | `/reviews/*` (admin-scoped) |

---

## RBAC Permission Matrix

| Permission | admin | doctor | patient |
|-----------|-------|--------|---------|
| manageUsers | ✓ | | |
| managePatients | ✓ | | |
| manageDoctors | ✓ | | |
| manageClinics | ✓ | | |
| manageSpecialties | ✓ | | |
| manageSchedules | ✓ | | |
| manageSlots | ✓ | | |
| manageAppointments | ✓ | | |
| managePayments | ✓ | | |
| manageReviews | ✓ | | |
| manageNotifications | ✓ | | |
| viewOwnProfile | | ✓ | ✓ |
| manageOwnProfile | | ✓ | ✓ |
| viewOwnSchedule | | ✓ | |
| bookAppointment | | | ✓ |
| manageOwnAppointments | | ✓ | ✓ |
| payAppointment | | | ✓ |
| manageOwnReviews | | | ✓ |
| viewOwnReviews | | ✓ | ✓ |
| manageOwnNotifications | | ✓ | ✓ |

---

## File Upload APIs

**Not implemented.** No file upload endpoints exist. The `notifications` module directory exists but is empty (no controller, routes, or service).

---

## Database Schema (Tables & Relationships)

| Table | Key Relationships |
|-------|------------------|
| `users` | Parent of `patients`, `doctors`, `refresh_tokens`, `notifications` |
| `clinics` | Parent of `doctors` (RESTRICT on delete) |
| `specialties` | Parent of `doctors` (RESTRICT on delete) |
| `doctors` | Child of `users`, `clinics`, `specialties`; parent of `doctor_schedules` |
| `doctor_schedules` | Child of `doctors`; parent of `appointment_slots` |
| `appointment_slots` | Child of `doctors`, `doctor_schedules`; parent of `appointments` (RESTRICT) |
| `patients` | Child of `users`; parent of `appointments` (RESTRICT) |
| `appointments` | Child of `patients`, `appointment_slots`; parent of `payments` (RESTRICT) and `reviews` |
| `payments` | Child of `appointments` (RESTRICT) |
| `reviews` | Child of `appointments` |
| `notifications` | Child of `users` (table exists, no API yet) |
| `refresh_tokens` | Child of `users`, stores hashed refresh tokens with expiry |