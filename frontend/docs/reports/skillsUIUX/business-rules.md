# Clinic Booking System — Ground Truth Business Rules

This file is the **single source of business truth** for the frontend. It is extracted
directly from the backend (`src/modules/*`, `src/shared/constants/permissions.ts`,
migrations, and `README.md`). Every UI decision — which button shows, which status
badge appears, which page a role can reach — must trace back to a rule in this file.

If a desired UI behavior is not backed by a rule here, **do not invent it**. Stop and
report it as a gap (see `SKILL.md` §Repository Constraints).

---

## 1. Roles

| Role | Who they are | Core capability |
|------|--------------|------------------|
| `patient` | Books and manages their own care | `BOOK_APPOINTMENT`, `MANAGE_OWN_APPOINTMENTS`, `PAY_APPOINTMENT`, `MANAGE_OWN_REVIEWS`, `MANAGE_OWN_PROFILE` |
| `doctor` | Manages their own schedule and assigned appointments | `VIEW_OWN_SCHEDULE`, `MANAGE_OWN_APPOINTMENTS` (own slots only), `VIEW_OWN_REVIEWS`, `MANAGE_OWN_PROFILE` |
| `admin` | Operates the practice | All `MANAGE_*` permissions across every domain (users, patients, doctors, clinics, specialties, schedules, slots, appointments, payments, reviews, notifications) |

Registration (`POST /auth/register`) **always** creates a `patient`. There is no
self-service doctor or admin signup — doctor/admin accounts are provisioned by an
admin. The UI must never imply a doctor or admin can "sign up" the same way a patient
does.

---

## 2. Status Enums (the vocabulary of every badge/label in the UI)

| Enum | Values | Used on |
|------|--------|---------|
| `slot_status` | `available`, `booked`, `cancelled` | Appointment slot |
| `appointment_status` | `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` | Appointment |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` | Payment |
| `payment_method` | `cash`, `card`, `bank_transfer`, `online` | Payment |

Never show a raw enum value (`no_show`, `bank_transfer`) as a label. Convert to
human copy: "No Show", "Bank Transfer". Status badges must carry a text label, not
color alone (accessibility rule, §16 of the design system).

---

## 3. Appointment Lifecycle (drives every action button)

```
scheduled ──confirm──► confirmed ──complete──► completed
   │                       │
   └──────cancel───────────┘──cancel──► cancelled
                                              
(any state, doctor/admin marks) ──► no_show
```

Rules enforced server-side — the UI must mirror these exactly, never guess:

- Only `scheduled` or `confirmed` appointments can be **cancelled**.
- **Patients** can cancel only their **own** appointments, and **only if the
  appointment is in the future**. A past `scheduled`/`confirmed` appointment shown to
  a patient must NOT offer Cancel — if this state is visually reachable, treat it as a
  data/edge-case and show status only, no dead button.
- **Doctors** can cancel only appointments tied to **their own** slots.
- Cancelling releases the slot back to `available`; deleting also releases the slot.
- A slot can have **at most one** appointment ever (unique constraint) — once booked,
  it's booked; there is no "double booking" state to design for.

### Action-visibility matrix (patient view of their own appointment)

| Appointment status | Payment status | Review exists | Valid action(s) |
|---|---|---|---|
| `scheduled` / `confirmed` (future) | — | — | **Cancel** |
| `scheduled` / `confirmed` (past — edge case) | — | — | none (status only) |
| `completed` | no payment row, or `pending`/`failed` | — | **Pay** |
| `completed` | `paid` | no | **Leave Review** |
| `completed` | `paid` | yes | **View Review** |
| `completed` | `refunded` | — | status only ("Refunded") — no Pay, no Review action implied unless product explicitly allows re-review |
| `cancelled` | — | — | none — show "Cancelled" status, optionally the reason if the API returns one |
| `no_show` | — | — | none — show "No Show" status |

Never render Pay on a `cancelled` or `no_show` appointment (backend rejects payment
for cancelled/completed-without-eligibility per the Payments module rule "cannot pay
for cancelled or completed appointments" — completed here means already paid/settled,
confirm against the live API response, not assumption). When in doubt about a specific
transition not listed above, treat the safe default as **no action shown** and report
the gap rather than guessing.

---

## 4. Ownership & Visibility Rules

- A patient only ever sees **their own** appointments, payments, reviews, profile —
  via the `/mine` or `/me` endpoints. Never build a patient screen that calls an admin
  list endpoint.
- A doctor only sees appointments **assigned to their own slots** and **their own**
  schedule — via `/doctor-schedules/me`, not the admin schedule list.
- Public (unauthenticated) pages may only show: doctor list/detail, clinic
  list/detail, specialty list/detail, available appointment slots. Nothing else is
  public — no appointments, no payments, no reviews, no user data.
- Admin pages are the only place full CRUD across all entities is shown. Do not leak
  admin-only actions (edit/delete arbitrary user, view all payments) into
  patient/doctor surfaces.

---

## 5. Data → Presentation Mapping

Raw field → what the UI must show instead (never the raw value):

| Raw / stored | Present as |
|---|---|
| `doctorId`, `clinicId`, `slotId`, `patientId`, any `*Id` | never shown; used only for actions/links |
| `specialtyId` | resolved specialty name |
| `slot_status = 'available'` | "Available" (bookable) |
| `appointment_status = 'no_show'` | "No Show" |
| `payment_method = 'bank_transfer'` | "Bank Transfer" |
| `consultation_fee` (number) | formatted currency, e.g. "$120" |
| `experience_years` | "12 years experience" |
| doctor + specialty + clinic + slot date/time | one composed line: "Dr. Amina Youssef, Cardiology · City Clinic · Mon 10:00–10:30" |

---

## 6. Constraints That Must Shape Forms/Flows (not just validation copy)

- `endTime > startTime` on schedules and slots — a time-range picker must enforce this
  before submit, not just show a server error after.
- `slotDuration > 0` — no zero/negative duration inputs.
- `consultation_fee >= 0`, `experience_years >= 0`.
- Review `rating` is 1–5, `comment` max 500 chars — show a live character counter as
  it approaches the limit, and constrain the star input to 1–5.
- Email uniqueness — inline "this email is already registered" messaging, not a raw
  409 dump.
- Slot booking is exclusive (`slot_id` UNIQUE on appointments) — once a slot is taken,
  the UI must reflect it as unavailable without requiring a manual refresh if the data
  layer already knows (e.g., after a failed booking attempt, refetch availability and
  explain: "This time was just booked by someone else — pick another.").

---

## 7. Empty-State Content Per Domain

| Screen | Why | What now | CTA |
|---|---|---|---|
| Patient — no upcoming appointments | Nothing booked yet | "Book a visit with a doctor to keep your care on track." | Book Appointment |
| Patient — no payment history | No completed/paid visits yet | "Your payment history will appear after your first visit." | — (none, informational) |
| Patient — no reviews left | No completed appointments reviewed | "Leave a review after your appointment is completed." | View Appointments |
| Doctor — no appointments today | Free day / no bookings | "You have no appointments scheduled for today." | View Full Schedule |
| Doctor — schedule not set up | No weekly template defined | "Set up your weekly availability so patients can book you." | Set Up Schedule (if doctor has this capability in-app; otherwise report as admin-only gap) |
| Admin — empty list (doctors/clinics/specialties) | Nothing created yet | "No {entity} have been added yet." | Add {Entity} |

---

## 8. Module Reference (for quick lookup while designing a page)

| Module | Patient sees | Doctor sees | Admin sees |
|---|---|---|---|
| Auth | register/login/own profile | login/own profile | login/own profile |
| Doctors | public list/detail (browse to book) | own profile only | full CRUD |
| Clinics | public list/detail | — | full CRUD |
| Specialties | public list/detail (filter doctors) | — | full CRUD |
| Doctor Schedules | — (indirect, via available slots) | own weekly schedule (`/me`) | full CRUD, any doctor |
| Appointment Slots | public availability (to pick a time) | indirectly via own appointments | full CRUD |
| Appointments | own only (`/mine`) — book/view/cancel | own-slot appointments only | full CRUD, all |
| Payments | own only (`/mine`) — pay | — | full CRUD, all |
| Reviews | own only — write/view | own received reviews (`VIEW_OWN_REVIEWS`) | full CRUD, all |
| Users (admin) | — | — | full CRUD |

Use this table before designing any page to confirm the role in front of you can
actually reach the data/action you're about to design.
