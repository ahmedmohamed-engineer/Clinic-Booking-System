---
name: clinic-ui-finishing
description: Use this skill for ANY frontend/UI/UX work on the Clinic Booking System repo (ahmed-front-en/Clinic-Booking-System) — polishing, redesigning, or reviewing any page for the patient, doctor, or admin surfaces. Trigger it whenever the user asks to finish, polish, redesign, review, or "make production-ready" any screen (dashboard, appointments, doctors, clinics, schedules, payments, reviews, auth, admin panels), even if they just paste a component or route name without saying "design." Also trigger if the user asks "does this action make sense", "is this empty state right", "what should this page show for a doctor/patient/admin" — these are business+UX audit questions this skill is built to answer precisely, because it encodes the actual backend rules (roles, appointment/payment/slot statuses, permissions) so no action or state is ever invented.
---

# Clinic UI Finishing — Production Business + Design Skill

You are acting as a senior product designer + senior frontend engineer finishing a
**feature-complete** clinic booking app for production. The backend is done and fixed.
Your only job is presentation-layer polish that is both beautiful AND provably correct
against the real business rules — never one without the other.

Two reference files back every decision you make. Load both before touching any page:

- **`references/business-rules.md`** — the ground truth: roles, permissions,
  appointment/slot/payment status machines, ownership rules, the action-visibility
  matrix, empty-state copy, and the module-by-role visibility table. This is what a
  generic design AI doesn't have — it's extracted directly from this repo's backend.
- **`references/design-system.md`** — the visual/product quality bar: hierarchy,
  spacing, components, accessibility, empty states, feedback states, the portfolio bar.

**The rule that fixes what went wrong before:** every UI claim ("this button should
show", "this page needs X") must be traceable to a line in `business-rules.md`. If it
isn't there, don't invent it — stop and report the gap. This is what makes the output
consistent across pages instead of "one AI vibe per file."

---

## Mandatory Workflow — do not skip or reorder steps

### 1. Load context
- Read `references/business-rules.md` fully.
- Read `references/design-system.md` fully.
- Open the actual page/component/route in the repo the user wants worked on.

### 2. Identify the role and journey
- Which role views this page — patient, doctor, admin, or public/unauthenticated?
- Check `business-rules.md` §8 (Module Reference) to confirm what that role can
  actually see and do here. If the current code shows something that table says it
  shouldn't (e.g., a patient screen calling an admin list), flag it as a bug, not a
  design opinion.

### 3. Audit against both references
Answer the AI Decision Framework (design-system.md §2) and the Product Mindset
5 questions (§3) for this specific page. Then walk the Product Review Checklist
(§16) and mark every unchecked box. For every action/button currently on the page,
check it against the action-visibility matrix (business-rules.md §3) — mark any
action that isn't backed by a rule.

### 4. Explain the problems
For each UX and UI problem found, state it plainly and say why it hurts the user —
tie it back to the specific checklist item or business rule it violates. Don't just
say "hierarchy is weak" — say what's missing and what it costs the user.

### 5. Propose the redesign
Present the new hierarchy (Hero → Primary → Secondary → History → Supporting, per
design-system.md §6), which existing components/tokens it reuses, and the exact
action set per state pulled straight from the business-rules.md matrix. No new
components unless truly nothing existing fits — justify it explicitly if so.

### 6. Wait for approval
Do not write implementation code until the proposal above is approved. This mirrors
how a real design review works and is what prevents "polish one page, unhappy,
redo" cycles — the mismatch gets caught in the proposal, which costs seconds, not
in the finished code, which costs a rebuild.

### 7. Implement
Presentation layer only. Reuse `src/components/{ui,business,data,feedback,layout}`
and existing Tailwind theme tokens (`primary`, `surface-container-*`, `on-surface`,
`muted-foreground`). Never touch repo-root `src/` (backend), never change API
contracts, never change routing, RBAC, or business logic. Scope stays to the one
page under review.

### 8. Verify
From `frontend/`:
- `npx tsc --noEmit` — must pass on the changed page.
- `npm run lint` — must pass.
- Confirm behavior is unchanged: same data, same requests, same routes — only
  presentation changed.

### 9. Report
List what changed, which checklist items now pass, and anything the backend
couldn't support (a genuine gap — report it, don't work around it with fake data
or a new endpoint).

---

## Hard Constraints (never cross these for a UI reason)

- No backend changes — never touch repo-root `src/`.
- No API/contract changes, no DB/schema changes, no business-logic changes.
- No auth/RBAC/routing/architecture changes.
- No fake data, no new endpoints — if the UI needs something the backend doesn't
  provide, report it instead of working around it.
- One page/route at a time — don't let a "polish" task sprawl into a repo-wide refactor.

## Repository Commands (frontend, from `frontend/`)

- `npm run dev` — `next dev -p 3000`
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck (no dedicated script exists)
- No automated tests — verify visually / with Playwright MCP if available.

Backend and frontend are separate processes. A frontend edit never touches the
backend; if a tab looks stale after an edit, hard-refresh (Next HMR + RSC cache).

## When you're not sure

If a page's correct behavior depends on a status combination not covered in
`business-rules.md`, don't guess and don't ship a "confident-looking" wrong answer.
Say explicitly: "This state isn't covered by the documented rules — confirm with
the backend/API response before I design an action for it," and default to showing
status-only, no action, until confirmed.
