# Healthcare Product Design System

**Single source of truth for all frontend implementation in this repository.**

Every future frontend task begins by reading this document. It defines how to think
like a Senior Product Designer before touching any UI, and the hard constraints that
govern every change. Read it fully before making any UI change.

---

## 1. Mission

This repository builds a **healthcare product** — not CRUD screens, not admin panels,
not a dashboard demo. Every page is part of a patient's, doctor's, or admin's real,
high-stakes experience. People rely on this software when they are unwell, pressed
for time, and trusting it with their care.

That changes how we work:

- We design for trust and clarity, not for convenience of implementation.
- We treat every screen as something a real patient will act on.
- We polish to a production standard. "Good enough" does not ship.
- We never sacrifice correctness of the workflow for visual convenience.

The project is **feature-complete**. Current work is product polish: making existing
functionality easier to understand, easier to use, and more consistent. We do not add
features; we make the ones that exist feel like a premium product.

---

## 2. AI Decision Framework

Before touching any page, think first. These are **mandatory rules**, not suggestions.

Ask yourself every one of these questions before you write any code:

1. **What is the business goal of this page?**
   Not "show appointments" — what is the user trying to accomplish and what must the
   page do to help them succeed?

2. **Who is the user?**
   A patient choosing care? A doctor managing a day? An admin operating the practice?
   The answer changes hierarchy, tone, and every action you show.

3. **What is the user's primary action?**
   Name the single most important thing the user should do on this page. It must be
   the most visible element.

4. **What information must be visible immediately?**
   Identify the two or three pieces of data the user cannot make a decision without.
   They lead the page.

5. **What information can wait?**
   Everything else is secondary: it goes lower, into a side column, or behind an
   action. Hiding it is not a loss — it is clarity.

6. **Is this page helping the user make a decision?**
   If the page does not move the user toward a decision or a next step, it is not
   doing its job.

7. **Would this page be impressive enough for a portfolio screenshot?**
   Would you be proud to show it? If not, it is not finished.

**If any answer is "No" — or the answer is not obvious — redesign the page mentally
before writing code.** Think about the new hierarchy, the new sections, and the new
primary action first. Only when the design is decided do you open the code.

Thinking first is not optional. The cost of a wrong design decision is paid by every
user who opens the page; the cost of thinking first is seconds.

---

## 3. Product Mindset

Every page must answer these five questions in order, the moment it loads:

1. **Where am I?** — the page is recognizable; the title and context are obvious.
2. **What is happening?** — the user sees their current state at a glance.
3. **What should I do next?** — the next best action is visible without searching.
4. **What is most important?** — the highest-priority information leads the page.
5. **What happened before?** — recent history gives context and continuity.

If a page does not answer all five, the design is unfinished. Move information and
actions until the answers are obvious.

---

## 4. Business First

The UI always follows the business.

- **Never invent actions** that the product cannot actually perform.
- **Never expose impossible actions** — if the workflow forbids it, the user must not see it.
- **Never break the workflow** — statuses, roles, and transitions are business truth.
- Buttons and states are derived from the confirmed business rules, never invented to
  make the screen look fuller.

When a desired UI element depends on data or behavior the backend does not provide,
**stop and report it**. Do not fake data, do not create endpoints, do not bend logic.

---

## 5. Healthcare Product Principles

The application must feel like a **premium healthcare product**. This is a quality bar,
not a style guide. Study the polish of products like Stripe, Linear, Notion, Headspace,
and Airbnb — not to copy them, but to internalize what makes software feel trustworthy:

- **Confidence** — spacing is generous but deliberate; nothing feels cramped or thrown together.
- **Clarity** — a user can scan the page in seconds and know what it is about.
- **Calm** — healthcare must not feel alarming; statuses, errors, and emphasis are measured.
- **Consistency** — the same thing always looks the same, everywhere in the app.
- **Precision** — alignment, type, color, and rhythm are exact, never approximate.
- **Respect** — copy is professional, warm, short, and never robotic.

Premium is the sum of thousands of small, correct decisions — not one big visual effect.

---

## 6. Information Architecture

Every page is organized as a **story**, from the most important question to the least:

1. **Hero** — the single most important thing: what is happening right now or what to do next.
2. **Primary section** — the main working area of the page.
3. **Secondary section** — supporting context, placed lower or in a side column.
4. **History** — what happened before, for continuity and trust.
5. **Supporting information** — details the user may want but does not need first.

Why hierarchy matters: a user should be able to find the important thing **without
reading**. If the layout makes them hunt, they will miss it. Group related content into
named sections — avoid random, disconnected cards. Each section has a clear heading and
a clear reason to exist.

**Prioritization rules:**

- The most decision-relevant information is in the primary position.
- Summary or overview leads; detail follows.
- Actions answer "now what?" and come before content that merely informs.
- Related destinations stay grouped and ordered by frequency of use.
- Navigation never becomes a dead end — every page offers a next step.

---

## 7. Visual Hierarchy

Hierarchy is built from these tools, used together and consistently:

- **Spacing** — more space between sections, less between related items. Consistent
  paddings and gaps make grouping readable. Use the design tokens, never ad-hoc values.
- **Typography** — one scale, distinct weights. Headings and numbers carry emphasis;
  body and captions recede. Never invent new type styles.
- **Contrast** — the primary action and key data stand out against the surface;
  secondary content recedes with muted color and smaller size.
- **Rhythm** — repeating gaps create predictable scan paths; the eye moves in a
  consistent flow down the page.
- **White space** — empty space is a feature. It separates sections and gives the
  important content room to breathe. Avoid both dead emptiness and density.
- **Emphasis** — one focal point per section. If everything is emphasized, nothing is.

A screen with weak hierarchy reads as "a bunch of stuff." A screen with strong
hierarchy reads as a decision: *this is what matters, this is what I do next.*

---

## 8. Component Philosophy

Never invent a second design language.

- **Reuse existing components** — cards, tables, dialogs, buttons, badges, inputs,
  empty states, skeletons, status badges.
- **Reuse existing design tokens** — colors, spacing, radii, shadows, typography.
- Maintain the same look across patient, doctor, and admin surfaces: same status
  colors, same spacing, same cards, same dialogs.
- **One source of truth** — when a pattern is needed in more than one place, build or
  reuse a shared component rather than copy-pasting one-off styles.
- A new pattern is justified **only when no existing component can express the need**.
  When in doubt, reuse.

Consistency is what makes an app feel like a product instead of a collection of pages.

---

## 9. Action Visibility

Buttons follow the current business state of the item they act on.

**Rules:**

- **Show only executable actions.** If an action is not valid now, do not render it.
- **Hide impossible actions.** A dead button is a lie; a missing button is clarity.
- **Primary action first** — leading, prominent, tied to the item's current state.
- **Secondary action later** — quieter, supporting, after the primary.
- **Never confuse the user.** If something is unavailable, either hide it or explain
  why — never leave a silent, disabled-looking control.

**Worked examples (appointment-driven journey):**

| State | Valid action |
|-------|--------------|
| Scheduled / Pending | Cancel |
| Confirmed | Cancel |
| Completed | Pay (if unpaid) |
| Paid | Leave Review |
| Reviewed | View Review |

On a dashboard, only show actions that are genuinely available:

- **Book Appointment** — always valid for a patient.
- **View Appointments** — always valid.
- **Complete Profile** — only when the profile is actually incomplete.

When payment or review is not yet available, explain why instead of showing a
misleading action. The presence of an action is a promise; every action must be kept.

---

## 10. Data Presentation

Convert stored data into information a person can act on. Never present storage
internals as user-facing content.

**Rules:**

- **Never expose IDs** — no raw `doctorId`, `clinicId`, `slotId`, `patientId`.
- **Never expose raw database fields** — show names, not keys; status labels, not enum codes.
- **Convert data into meaningful information** — "Doctor Name", "Clinic Name",
  "Specialty", "Appointment Date", "Appointment Time", "Payment Status".
- **Group related information** — organize a card or row into logical sections, not a
  flat list of raw values.
- **Human-readable labels only** — every value is labelled, capitalized, and spelled out.

**Grouping example** — present an appointment as:

- **Doctor** — name and specialty
- **Clinic** — name and location
- **When** — date and time
- **Cost / Payment** — amount and status
- **Status** — appointment, payment, or review status

**Principles:**

- Tell a story instead of dumping fields: "Dr. Smith, Cardiology · City Clinic ·
  Mon 14:00–14:30 · Paid".
- Label every value so its meaning is self-evident.
- Keep the same wording and order across pages.
- The presentation matches how a real user would describe the object.

---

## 11. Empty States

A blank page is a failure of guidance. Never show a bare "No data".

Every empty state must contain all three:

1. **Why** — why there is nothing here.
2. **What now** — a short, plain explanation of the situation.
3. **One CTA** — a single, working action that moves the user forward, whenever one exists.

**Example:**

- Title: "You have no upcoming appointments."
- Explanation: "Book a visit with a doctor to keep your care on track."
- CTA: **Book Appointment**

If no action exists (for example, an admin waiting on patient data), the empty state
explains what will cause the list to populate. An empty state is an opportunity to
continue the journey, never a dead end.

---

## 12. Dashboard Philosophy

A dashboard is **not a collection of cards**. It is a **decision-making page**.

A great dashboard answers, in order:

1. **What is most important today?** — one clear hero: the next appointment, the next
   decision, the alert that needs attention.
2. **What can I do now?** — a small set of valid, primary actions.
3. **What do I have?** — the working lists (upcoming, schedule, history).
4. **Supporting context** — profile, summary, or reference information in a side column.

Organize the dashboard into named, meaningful sections — for example *Next Appointment*,
*Quick Actions*, *Upcoming Appointments*, *Health Summary*. Never scatter disconnected
cards. If a number is shown, it must mean something and lead somewhere.

A dashboard fails when it is a wall of widgets; it succeeds when it points the user at
the one thing that matters and the one action to take.

---

## 13. Standard Frontend Workflow

This is the **mandatory workflow for every frontend task**. Do not skip steps and do
not reorder them.

1. **Read this document completely.** It is the source of truth for how to think and work.
2. **Understand the business workflow.** Know the role, the journey, and the status rules
   before designing anything.
3. **Audit the existing page.** Review it against every section of this document.
4. **Identify UX problems.** What confuses, hides, or dead-ends the user?
5. **Identify UI problems.** What breaks hierarchy, consistency, spacing, or polish?
6. **Explain the problems.** For each one, say why it hurts the user.
7. **Propose improvements.** Present the redesigned page using existing components and
   tokens, with the reasoning behind the new hierarchy.
8. **Wait for approval.** Implementation never begins until the audit and proposal are
   approved.
9. **Implement.** Apply the approved proposal, presentation layer only.
10. **Verify.** Confirm all three:
    - **TypeScript** — the changed page passes `npx tsc --noEmit`.
    - **ESLint** — the changed page passes `npm run lint`.
    - **Repository Rules** — no backend, API, business logic, routing, RBAC, or
      architecture was touched; behavior is unchanged.
11. **Report.** List what changed, what became clearer, and anything the backend could
    not support.

**Hard rule: implementation NEVER starts before the audit is approved.** The audit and
proposal are the design; code is only the execution of an approved design.

---

## 14. Page Workflow

**The product flow the user experiences:**

- **Orientation** — the user lands and instantly knows where they are.
- **Recognition** — they see their data and current state.
- **Decision** — the next action is visible and valid.
- **Act** — they act and receive clear feedback.
- **Continuity** — they know what happens next and where to go.

**Feedback states (applied to every interaction):**

- **Loading** — every async operation has feedback: skeletons for lists, spinners on
  buttons, disabled controls while submitting.
- **Error** — never expose technical errors. Say "Unable to load appointments. Please
  try again.", never "Unexpected Error".
- **Confirmation** — require it only for destructive actions (delete, cancel an
  appointment). Never confirm plain navigation.
- **Success** — every successful mutation confirms itself: "Appointment booked.",
  "Profile updated.", "Review submitted."

---

## 15. Portfolio Rule

Every page must be beautiful enough to become a **portfolio screenshot** — not merely
functional. If a page would embarrass you in a public portfolio, it is not done.

This means:

- Alignment, spacing, and typography are exact.
- No awkward gaps, no crowded rows, no orphaned elements.
- Icons, labels, and values align and breathe consistently.
- Every state (loaded, loading, empty, error) is considered and polished.

Beauty is not decoration; it is the visible proof of care — and in healthcare, care is
the product.

---

## 16. Accessibility

Accessibility is not optional polish; it is part of the design.

- **Keyboard** — every action is reachable by keyboard: buttons and links are
  focusable, dialogs trap focus and close predictably, selectable cards respond to
  Enter/Space.
- **Focus** — visible focus states everywhere (focus-visible rings on links, buttons,
  and cards); never remove outlines silently.
- **Contrast** — text and status colors meet contrast requirements; never rely on
  color alone to communicate (status badges carry labels too).
- **Semantics & labels** — meaningful headings with `aria-labelledby`, labelled inputs,
  descriptive button text, `role="alert"` for errors.
- **Responsive behavior** — desktop first, then tablet, then mobile; nothing overflows
  at any breakpoint; touch targets stay usable.
- Don't stack contradictory ARIA on one element (for example, both `aria-label` and
  `aria-labelledby`).

Preserving accessibility is a baseline. Improvements must never regress it.

---

## 17. Product Review Checklist

Before considering any page finished, verify every item. If any box is unchecked, the
page is not done.

- [ ] The page has a clear **Hero** — one focal point that answers "what is important now?".
- [ ] **Visual hierarchy** is obvious — the user knows what to look at first.
- [ ] **Primary action** is immediately visible and executable.
- [ ] **Impossible actions** are hidden.
- [ ] Information is **grouped logically** into named sections.
- [ ] **Empty states** explain what to do and offer one CTA.
- [ ] **White space** is sufficient — nothing is cramped or scattered.
- [ ] **Components are consistent** — same cards, tokens, and patterns as the rest of the app.
- [ ] **Typography has hierarchy** — headings lead, body recedes, emphasis is intentional.
- [ ] The page **feels like a healthcare product** — calm, trustworthy, professional.
- [ ] The page **could be presented in a portfolio**.

Use this list in step 6 and step 10 of the Standard Frontend Workflow: it is both how
you find problems in the audit and how you prove the result.

---

## 18. Repository Constraints

**Presentation layer only.** These boundaries are absolute — never cross them for a UI
reason:

- **No backend changes** — never touch the repo-root `src/`.
- **No API changes** — never alter contracts, endpoints, or response shapes.
- **No database changes** — no schema, no migrations.
- **No business-logic changes** — statuses, transitions, and rules are fixed.
- **No auth or RBAC changes** — roles, permissions, and guards are fixed.
- **No routing changes** — never move, rename, or reorder routes.
- **No architecture changes** — folder structure, layering, module wiring are fixed.
- **No fake data, no new endpoints** — if the backend lacks what the UI needs, report
  it; do not work around it.
- **One page at a time** — scope stays limited to the page under review.

**Definition of done:** the changed page typechecks, lints, behaves identically to
before (presentation only), and breaks nothing else.

### Repository reference

This repo holds two separate apps. The **Express + PostgreSQL backend lives at the repo
root** (`src/`); the **Next.js frontend lives in `frontend/`**. The backend does **not**
serve the UI — the browser app is only reachable via the Next dev server.

**Backend (from repo root):**

- `npm run dev` — `tsx watch src/server.ts`
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — `tsc` **then** `scripts/copy-migrations.mjs` (built output needs
  `dist/migrations`)
- `npm run db:test` / `npm run db:cleanup` — psql validation against the dockerized DB
  (`clinic_booking`, user/pass `postgres`/`postgres`); this is the only test suite
- Postgres 17 runs in Docker via `.devcontainer/docker-compose.yml`; root `.env` holds
  DB + JWT config and is gitignored

**Frontend (from `frontend/`):**

- `npm run dev` — `next dev -p 3000`
- `npm run lint` — ESLint
- `npm run build` — `NODE_ENV=production next build`
- no `typecheck` script — use `npx tsc --noEmit`
- no automated tests — UI is verified with Playwright MCP (`.playwright-mcp/`, `test-results/`)

**Architecture notes:**

- Backend: strict modular layering (controllers → services → repositories → raw SQL via
  `pg`, no ORM); per-domain modules in `src/modules/<domain>/`; routing mounted in
  `src/routes/index.ts`; middlewares `authenticate()` (JWT), `authorize()` (RBAC),
  `validate()` (zod). Migrations are versioned raw SQL with a tracking table; users and
  slots are soft-deleted.
- Frontend: Next.js App Router; route groups `(public)`, `(authenticated)`, `(admin)`
  with `*-guard-wrapper.tsx`; features in `src/features/<entity>/{api,hooks,index.ts}`
  imported through the barrel `@/features/<entity>`; shared UI in
  `src/components/{ui,business,data,feedback,layout}`; design tokens as Tailwind theme
  classes (`primary`, `surface-container-*`, `on-surface`, `muted-foreground`); client
  data via TanStack Query with query keys in `src/lib/query-keys.ts`.
- Backend and frontend run as separate processes — a change in one never affects the
  other; if a frontend tab looks stale after an edit, hard-refresh (Next HMR + RSC cache).
- `dist/` (repo root) is compiled backend output — never edit; regenerate with
  `npm run build`.

---

## 19. Final Golden Rules

1. **Improve clarity. Never change logic. Never change behavior. Never surprise the user.**
2. **Never optimize individual components. Always optimize the complete page experience.**
   Optimizing isolated cards is how products become inconsistent: each card looks
   reasonable alone, and together they form a chaotic page. Design decisions are made
   at the page level — the hero, the sections, the flow — and components serve that
   whole. Judge every change by how the *complete page* reads, not how the card looks.
3. **Every page should be beautiful enough to become a portfolio screenshot.**
   Visual quality is part of the product itself, not decoration. A polished page
   communicates care and competence; in healthcare that trust is the product.
4. Present business information, never storage internals — no raw IDs, no raw fields.
5. Show only executable actions; hide impossible ones; primary action first.
6. Every empty state explains *why*, *what now*, and offers **one** working CTA.
7. Reuse existing components and tokens; never invent a second design language.
8. Dashboards are decision-making pages, not collections of cards.
9. Accessibility is part of the design: keyboard, focus, contrast, responsive.
10. UI follows business; never fake data, never new endpoints, never break the workflow.
11. Think first: answer the AI Decision Framework before touching any code.
12. Implementation is forbidden before approval.
13. When in doubt, keep the change smaller.
14. Read this document before making any UI change.
