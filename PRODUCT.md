# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: **patients** of a B2C clinic booking service. They use the frontend in two situations, both confirmed:

- **Quick one-off booking** — find a doctor, pick a real available time, and confirm with minimal friction.
- **Comparing and managing care over time** — compare doctors/clinics, book appointments, manage and cancel them, record payments, and leave reviews.

Secondary audiences (confirmed from the codebase, not re-interviewed): **doctors** manage their own schedules and appointments; **admins** have full CRUD across all resources. The confirmed focus for this work is the **frontend UX/UI only** — backend behavior is out of scope.

## Product Purpose

MediCare is a clinic appointment booking system that lets patients register, browse real doctors and clinics, book from real available slots, manage and cancel appointments, record payments, and review completed visits. Success for the patient is booking the right care at the right time with zero friction; success for the clinics is a reliable, live, booked schedule.

## Positioning

MediCare delivers the smoothest, most intuitive booking experience for patients — with **real-time availability and zero friction**. This claim is grounded in the product mechanism: availability and booking flows run against real production data, so what a patient sees is what the clinic has.

## Operating Context

- Patients reach the product through the responsive web frontend (Next.js App Router, mostly client-side rendered) on desktop and mobile.
- Booking happens through a multi-step wizard: browse/search doctors → view real availability → pick a slot → confirm (with optional payment recording).
- Authenticated areas: patient dashboard, appointments, payments, reviews, profile; doctor schedule management; admin CRUD tables.
- The frontend runs on Vercel; the backend REST API runs on Railway with a Neon PostgreSQL database. Both are live at the time of this writing.

## Capabilities and Constraints

- **Frontend scope is confirmed**: this product record governs the frontend UX/UI. Backend/API behavior is an existing, documented constraint (see `README.md`), not a work target.
- Live production deployments: frontend `https://clinic-booking-system-two.vercel.app`, backend `https://clinic-booking-system-production-2a48.up.railway.app` (verified responding).
- Patient capabilities: register/login, browse doctors & clinics by specialty, view real available slots, book, manage and cancel own appointments, record payments, review completed appointments (one review, rating 1–5, per completed visit), edit profile, upload avatar.
- Doctor capabilities: manage own weekly schedule, view/manage own appointments. Admin: full CRUD over users, patients, doctors, clinics, specialties, schedules, slots, appointments, payments, reviews.
- Technical stack (existing, not a decision): Next.js 16 + React 19 + TypeScript, Tailwind CSS 4, shadcn-style components on Base UI React, TanStack Query, Axios with token-refresh interceptors, React Hook Form + Zod, date-fns / react-day-picker.
- Access tokens live in memory only; refresh token in `localStorage`. Route protection is client-side via guards.
- No payment gateway — payments are manual record-keeping (`cash`, `card`, `bank_transfer`, `online`).
- Notifications module is unimplemented (table exists; no API or UI).

## Brand Commitments

- Product name: **MediCare** (confirmed in codebase: layout title, logo, footer, landing copy).
- Landing tagline: "Your health journey, simplified" / "Modern care, simple booking."
- Human, trustworthy, clinical-but-warm voice. Light/dark theming exists.

## Evidence on Hand

- **Live production data (verified at init time):** the backend API serves real doctors, real clinic names, real specialties, real consultation fees, real bios, and real availability. Examples verified: Dr. Heba Aziz (Orthopedics, Alexandria Health Hub); Dr. Amr ElSayed (Cardiology, Nile Medical Center). `GET /health` returns `{"status":"ok"}`; `GET /api/v1/doctors` returns populated data; frontend responds 200.
- **Evidence policy (confirmed):** use real clinic names, real doctor profiles, and real availability data from the production APIs. **Never fabricate** patient testimonials, reviews, or clinic credentials.
- **Mock data policy (confirmed):** the frontend may use mock/demo content only for loading and error states — never for business logic.
- The repository documents APIs, architecture, and database schema in `README.md`, `PROJECT_REPORT.md`, `frontend/README.md`, and `frontend/docs/`.

## Product Principles

1. **Zero friction to book.** The fewer steps, fields, and decisions between "find a doctor" and "confirmed," the better. Wizard steps must each be obviously necessary.
2. **Real availability, always.** Everything a patient sees about doctors, clinics, or open slots must come from production data. The interface must never invent providers or slots.
3. **Honest states.** Loading, empty, and error states are first-class; demo content is allowed there and only there, clearly distinct from real data.
4. **Trust through transparency.** Fees, clinic names, doctor credentials, and booking status are shown plainly; nothing is hidden behind a manager decision.
5. **Frontend-first.** This product record's home for design work is the frontend; backend behavior is treated as the documented contract it already is.

## Accessibility & Inclusion

WCAG 2.1 **AA** is the required standard for the patient-facing frontend. All design and implementation work must meet it (keyboard operability, focus visibility, contrast, labels, reduced-motion respect, and error clarity).