# Healthcare Product Design System (Clinic Booking System)

This is the full visual/product design standard for this repo, as defined by the
product owner. Read it alongside `business-rules.md` (the business truth for this
specific backend) — every design decision here must be grounded in an actual rule
from that file, never invented.

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
2. **Who is the user?** Patient, doctor, or admin — it changes hierarchy, tone, and actions.
3. **What is the user's primary action?** Name it. It must be the most visible element.
4. **What information must be visible immediately?** The 2–3 facts the user needs to decide.
5. **What information can wait?** Everything else — lower, side column, or behind an action.
6. **Is this page helping the user make a decision?** If not, it isn't doing its job.
7. **Would this page be impressive enough for a portfolio screenshot?**

**If any answer is "No" — or not obvious — redesign the page mentally before writing
code.** Thinking first is not optional.

---

## 3. Product Mindset

Every page must answer these five questions in order, the moment it loads:

1. **Where am I?** — the page is recognizable; title and context are obvious.
2. **What is happening?** — the user sees their current state at a glance.
3. **What should I do next?** — the next best action is visible without searching.
4. **What is most important?** — the highest-priority information leads the page.
5. **What happened before?** — recent history gives context and continuity.

If a page does not answer all five, the design is unfinished.

---

## 4. Business First

- **Never invent actions** the product cannot actually perform.
- **Never expose impossible actions** — if the workflow forbids it, the user must not see it.
- **Never break the workflow** — statuses, roles, and transitions are business truth.
- When a desired UI element needs data/behavior the backend doesn't provide, **stop
  and report it**. Do not fake data, do not create endpoints, do not bend logic.

---

## 5. Healthcare Product Principles

Study the polish of Stripe, Linear, Notion, Headspace, Airbnb — not to copy, but to
internalize what makes software feel trustworthy:

- **Confidence** — spacing is generous but deliberate.
- **Clarity** — a user can scan the page in seconds and know what it is about.
- **Calm** — healthcare must not feel alarming; statuses and errors are measured.
- **Consistency** — the same thing always looks the same, everywhere.
- **Precision** — alignment, type, color, and rhythm are exact.
- **Respect** — copy is professional, warm, short, never robotic.

Premium is the sum of thousands of small, correct decisions — not one big visual effect.

---

## 6. Information Architecture

Every page is a **story**, most important question first:

1. **Hero** — the single most important thing right now.
2. **Primary section** — the main working area.
3. **Secondary section** — supporting context, lower or side column.
4. **History** — what happened before, for continuity and trust.
5. **Supporting information** — nice-to-know, not need-to-know-first.

Group related content into named sections — avoid random, disconnected cards.

---

## 7. Visual Hierarchy

- **Spacing** — more between sections, less between related items; use tokens, never ad-hoc values.
- **Typography** — one scale, distinct weights; headings/numbers carry emphasis.
- **Contrast** — primary action and key data stand out; secondary content recedes.
- **Rhythm** — repeating gaps create predictable scan paths.
- **White space** — a feature, not empty space to fill.
- **Emphasis** — one focal point per section.

---

## 8. Component Philosophy

Never invent a second design language.

- **Reuse existing components** — cards, tables, dialogs, buttons, badges, inputs,
  empty states, skeletons, status badges.
- **Reuse existing design tokens** — colors, spacing, radii, shadows, typography.
- Same look across patient, doctor, and admin surfaces.
- A new pattern is justified **only when no existing component can express the need**.

---

## 9. Action Visibility

- **Show only executable actions.** If not valid now, do not render it.
- **Hide impossible actions.** A dead button is a lie; a missing button is clarity.
- **Primary action first**, leading and prominent; **secondary later**, quieter.
- **Never leave a silent, disabled-looking control** — hide it or explain why.

See `business-rules.md` §3 for the exact appointment-lifecycle action matrix for this
backend — use it, don't re-derive it from memory or intuition.

---

## 10. Data Presentation

- **Never expose IDs** — no raw `doctorId`, `clinicId`, `slotId`, `patientId`.
- **Never expose raw database fields** — names not keys, status labels not enum codes.
- **Group related information** into logical sections, not a flat list of raw values.
- **Human-readable labels only** — every value labelled, capitalized, spelled out.

Tell a story instead of dumping fields: "Dr. Smith, Cardiology · City Clinic ·
Mon 14:00–14:30 · Paid" — not a table of raw columns.

---

## 11. Empty States

Never show a bare "No data". Every empty state has all three:

1. **Why** — why there is nothing here.
2. **What now** — a short, plain explanation.
3. **One CTA** — a single, working action forward, whenever one exists.

See `business-rules.md` §7 for concrete copy per screen in this app.

---

## 12. Dashboard Philosophy

A dashboard is a **decision-making page**, answering in order:

1. **What is most important today?** — one clear hero.
2. **What can I do now?** — a small set of valid, primary actions.
3. **What do I have?** — the working lists.
4. **Supporting context** — profile/summary in a side column.

Organize into named sections (*Next Appointment*, *Quick Actions*, *Upcoming
Appointments*, *Health Summary*) — never scatter disconnected cards.

---

## 13. Page Workflow & Feedback States

Flow: **Orientation → Recognition → Decision → Act → Continuity.**

- **Loading** — skeletons for lists, spinners on buttons, disabled controls while submitting.
- **Error** — never expose technical errors. "Unable to load appointments. Please try
  again." — never "Unexpected Error" or a raw backend error body.
- **Confirmation** — only for destructive actions (delete, cancel). Never confirm plain navigation.
- **Success** — every successful mutation confirms itself: "Appointment booked.",
  "Profile updated.", "Review submitted."

---

## 14. Portfolio Rule

Every page must be beautiful enough to become a **portfolio screenshot**:

- Alignment, spacing, typography exact — no awkward gaps, no crowded rows.
- Every state (loaded, loading, empty, error) considered and polished.

Beauty is not decoration; it is the visible proof of care — in healthcare, care is the product.

---

## 15. Accessibility

- **Keyboard** — every action reachable; dialogs trap and close focus predictably;
  selectable cards respond to Enter/Space.
- **Focus** — visible focus-visible rings everywhere; never silently remove outlines.
- **Contrast** — meets requirements; never rely on color alone (status badges carry labels too).
- **Semantics** — meaningful headings with `aria-labelledby`, labelled inputs,
  descriptive buttons, `role="alert"` for errors.
- **Responsive** — desktop → tablet → mobile; nothing overflows; touch targets usable.
- Don't stack contradictory ARIA on one element.

---

## 16. Product Review Checklist

Before any page is "done", verify every item:

- [ ] Clear **Hero** — one focal point answering "what matters now?".
- [ ] **Visual hierarchy** obvious — user knows what to look at first.
- [ ] **Primary action** immediately visible and executable.
- [ ] **Impossible actions** hidden.
- [ ] Information **grouped logically** into named sections.
- [ ] **Empty states** explain what to do, offer one CTA.
- [ ] **White space** sufficient — nothing cramped or scattered.
- [ ] **Components consistent** — same cards, tokens, patterns as rest of app.
- [ ] **Typography has hierarchy** — headings lead, body recedes.
- [ ] Page **feels like a healthcare product** — calm, trustworthy, professional.
- [ ] Page **could be a portfolio screenshot**.
- [ ] Every action shown is backed by a rule in `business-rules.md` — nothing invented.
