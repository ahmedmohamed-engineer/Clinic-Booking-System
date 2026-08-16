---
name: The Prescription Pad
description: Clinic booking as a written prescription — night desk by default, cream-paper day sheet by toggle, one red stamp, Archivo letterhead and Kalam ink.
colors:
  background: "#f7f3ea"
  foreground: "#16325c"
  card: "#fffdf8"
  popover: "#fffdf8"
  primary: "#c2412c"
  on-primary: "#fffdf8"
  primary-container: "#f7e3dd"
  secondary: "#16325c"
  on-secondary: "#f7f3ea"
  secondary-foreground: "#f7f3ea"
  tertiary: "#0f9d68"
  on-tertiary: "#f7f3ea"
  muted: "#f0ead9"
  muted-foreground: "#55617a"
  accent: "#ede7d8"
  accent-foreground: "#16325c"
  destructive: "#b3261e"
  success: "#0b7d55"
  warning: "#b45309"
  info: "#16325c"
  border: "#d8d2c2"
  input: "#cfc8b8"
  outline: "#8b94a6"
  outline-variant: "#cfc8b8"
  surface-container-lowest: "#fffdf8"
  surface-container-low: "#f4efe3"
  surface-container: "#fffdf8"
  surface-container-high: "#ede7d8"
  surface-container-highest: "#e4ddca"
  surface-bright: "#fffdf8"
  frame-night: "#141b2e"
  frame-day: "#f7f3ea"
  day-sheet-text: "#475569"
  night-ink: "#f3efe2"
  night-card: "#1c2440"
  night-muted: "#232c4c"
  night-muted-foreground: "#b6bcc9"
  night-border: "#2b3652"
  night-input: "#3a4666"
  stamp: "#d9553d"
  night-stamp: "#e0614a"
  ruled-ink: "rgba(22, 50, 92, 0.14)"
  night-ruled-ink: "rgba(243, 239, 226, 0.12)"
  letterhead-ink: "rgba(22, 50, 92, 0.28)"
  night-letterhead-ink: "rgba(243, 239, 226, 0.22)"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.375"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  ink:
    fontFamily: "Kalam, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
rounded:
  sm: "5px"
  md: "6px"
  lg: "8px"
  xl: "11px"
  2xl: "14px"
  3xl: "18px"
  4xl: "21px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 12px"
  button-primary-hover:
    backgroundColor: "#c2412c"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 12px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 12px"
  input-text:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "36px"
    padding: "4px 12px"
    borderColor: "{colors.input}"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  paper-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "24px 28px"
---

# Design System: The Prescription Pad

## Overview

**Creative North Star: "The Prescription Pad"**

Booking an appointment here is not choosing from a grid — it is standing at the desk while a prescription is written for you, line by line, and stamped. Every screen is a sheet on the pad: a letterhead (the clinic mark), ruled writing lines carrying the facts of the visit (clinic, specialty, doctor, time), and one red rubber stamp falling on the decisive action. The familiar "doctor-list-grid-and-blue SaaS" register is refused outright; the world's own materials — paper, ink, ruled lines, stamp, carbon copy — carry the whole system.

The pad opens on the **night desk** by default: a deep navy-slate ground (`--background: #141b2e`) with cream ink (`--foreground: #f3efe2`), set before first paint so a stored or default theme never flashes. A single **ThemeToggle** (moon/sun crossfade, ghost button) swings every layout — AuthLayout, Navbar, AdminNavbar — to the cream **day sheet** (`--background: #f7f3ea`, ink-blue print, slate body text), and back again. Both modes use one token system: `:root` holds the day-sheet values, `.dark` overrides them; the frontmatter lists the day-sheet values as canonical and the night-desk values explicitly below.

**Key Characteristics:**
- Dark-default: the night desk is the ground truth; the cream day sheet is one quiet toggle away, everywhere.
- The document metaphor: `paper-sheet` surfaces, `letterhead-rule` double rules, `stamp-ring` rubber stamps, carbon-copy sheets tucked behind offsets.
- Tokenized ruled writing lines: `.ruled` runs a repeating `--color-ruled-rule` at a strict 28px cadence, tuned per mode.
- Two typefaces with strict roles: Archivo (letterhead/print) everywhere; Kalam (`font-ink`) only for handwritten ink — the Rx mark and the hero being written.
- One committed action accent — the stamp red — plus style-ink blue for structure and a deep pharmacy green for availability/confirmation.

## Colors

A document palette: cream papers, slate-to-navy inks, one red stamp for action, one deep green for "available / done." Status colors are writes on the document, not decoration.

### Primary
- **Stamp Red** (#c2412c): the primary accent — primary buttons, selected time slots, active wizard steps, links, icon moments, the "Admin" tag. It is the rubber stamp: committed but rare.
- **On Primary** (#fffdf8): text/icon on primary fills (parchment white).
- **Primary Container** (#f7e3dd): soft red-tinted surfaces (chips, `bg-primary/5`, `bg-primary/10` containers).
- **Night Stamp** (#e0614a): the same accent, tempered for the night desk (`--primary` under `.dark`).
- **Stamp Ring** (#d9553d — `--color-stamp`): the double-ring border color of `.stamp-ring` surfaces (the logo Rx). Note in the build: stamp *text* set in `text-primary` renders #c2412c while its ring renders #d9553d — a two-red stamp moment, documented as the current state.

### Secondary
- **Print Ink** (#16325c): the day-sheet ink blue — body text, headings, secondary actions, focus rings, `--foreground`/`--on-surface`/`--info` in light mode, `--ring` in dark. It reads as the pen every line is written with.
- **Night Powder** (#8fb0e8): the ink blue's night-desk equivalent (`--secondary`, `--ring` under `.dark`), used for structural highlights against the desk.

### Tertiary
- **Pharmacy Green** (#0f9d68): availability and confirmation only — free slots, success stamps, the booked ring. Night desk: **Mint Ash** (#2fc29b).

### Neutral
- **Day Sheet** (#f7f3ea): the light-mode page ground (`--background`); **Night Desk** (#141b2e) is the default frame. **Night Cream** (#f3efe2) is the primary text on the desk.
- **Parchment** (#fffdf8): cards, popovers, sheets (`--card`/`--popover` = `--surface-container-lowest`); **Night Slate** (#1c2440) is its dark twin.
- **Ink Slate** (#16325c): primary text in light mode.
- **Slate** (#475569): the stated day-sheet secondary-text value; the shipped token is **Slate Muted** (#55617a) (`--muted-foreground`, `.body-text`, form help). Night twin: **Dust Slate** (#b6bcc9).
- **Faded Paper** (#f0ead9): `--muted` fills (hover, table headers, zebra); **Night Muted** (#232c4c) under `.dark`.
- **Hairline Ink** (#d8d2c2): borders and strokes (`--border`); **Night Hairline** (#2b3652) under `.dark`.
- **Ink Stroke** (#cfc8b8): input strokes (`--input`); **Night Stroke** (#3a4666) under `.dark`.
- **Outline Ash** (#8b94a6): outline and divider roles (both modes).
- **Surface family:** containers step lowest `#fffdf8` → low `#f4efe3` → container `#fffdf8` → high `#ede7d8` → highest `#e4ddca`; night desk steps `#1c2440 → #1a2138 → #1c2440 → #232c4c → #2b3652`.

### Status
- **Deep Green** (#0b7d55) — success/available/paid/completed; **Mint Ash** (#2fc29b) at night.
- **Amber Sepia** (#b45309) — pending/warning; **Night Amber** (#e8a24c) at night.
- **Clinic Red** (#b3261e) — error/destructive/cancelled/failed; **Night Red** (#e07a68) at night.
- **Info** — ink blue (#16325c) by day, powder (#8fb0e8) at night; **Neutral** — slate-muted (#55617a) by day, dust (#b6bcc9) at night.

### Named Rules
**The Night-Desk Default Rule.** The pad opens dark. Unset visitors get the night desk; `localStorage("hf_theme")` and a pre-paint inline script lock the mode before first render. Light is a toggle, never a default.
**The One Stamp Rule.** The red accent marks the single decisive action on a surface. Wherever it appears more than once (a slot picker, a wizard), it marks *current selection* — it never decorates.
**The Print Ink Rule.** Ink blue is the writing color. Structure, text, and non-decisive actions are written in ink blue; introducing a second decorative color is a system decision, not a local flourish.

## Typography

**Display Font:** Archivo (via `next/font/google`, `--font-archivo`; ui-sans-serif/system-ui fallbacks)
**Body Font:** Archivo (same variable family, `--font-sans`)
**Label Font:** Archivo (case + tracking carry the role)
**Ink Font:** Kalam (via `next/font/google`, `--font-kalam`, weights 400/700; `--font-ink`)

**Character:** A letterpress print voice. Archivo is the letterhead type — structurally open, set tight with negative tracking at the top of the hierarchy, and with print-metadata in uppercase micro-labels ("APPOINTMENT PRESCRIPTION", "NO. 02481"). Kalam is the hand that writes on the sheet — rationed to inked annotations: the Rx mark (Logo) and the hero's being-written lines. Hierarchy is carried by weight, size, and case, not by a second text face.

### Hierarchy
- **Display/Headline** (700, 1.5rem/24px, 1.25): the page-sheet title (`.heading-1`, `DashboardHeader`, dynamic pages). The system's type tops out here — there is no oversized hero display register; the hero's loudest type is the letterhead wordmark.
- **Title** (600, 1rem/16px, 1.375): card titles (`CardTitle`), in-page titles.
- **Body** (400, 0.875rem/14px, 1.6): default text for cards, tables, forms (`.body-text` in slate-muted #55617a).
- **Label** (600, 0.72rem/11.5px, +0.12em, uppercase): printed field labels and section eyebrows (`.heading-2`).
- **Ink** (Kalam 400/700, 1rem→1.125rem, ~1.6): handwritten annotations only — the Rx glyph and the hero lines while they are being written.
- **Tabular** (`font-variant-numeric: tabular-nums`, `.tabular`): every numeric — fees, times, dates, reference numbers, phone numbers.

### Named Rules
**The Ink Ration Rule.** Kalam is the hand on the sheet, and a hand writes only a little. The `font-ink` role is confined to the Rx mark and the hero's inked lines; falling back to it for UI copy turns the document into a scribble.
**The Printed Label Rule.** Metadata reads as print: uppercase, +0.12em tracking, 11.5px, muted — headings read as ink, metadata reads as typeset.

## Layout

- **Frame:** full-bleed `bg-background text-on-surface` (`body`), fixed-height 56px headers (`h-14`) with a hairline `border-b border-border`; the **ThemeToggle** sits at the header's right in every chrome: AuthLayout, Navbar (sticky, `bg-background/90 backdrop-blur-sm`), AdminNavbar (on `bg-surface-container-low`).
- **Admin/authenticated shell:** fixed 240px sidebar (`w-60`, `border-r`, `bg-surface-container-low`) ≥1024px; the mobile drawer is the same surface via `Sheet`.
- **Container:** `container-custom` — max-width 1280px, centered; 16px side padding, 24px ≥640px, 32px ≥1024px.
- **Rhythm:** 4px base unit; the working rhythm is 8/12/16/24/32 (button-gaps 6px, card padding 16px, sheet padding 24px, auth panes `space-y-6`).
- **Sheets:** forms span a `paper-sheet` pane capped at `max-w-sm` (~384px) — a single upright sheet on the desk, with `letterhead-rule`, `heading-1` title, and `shadow-md`.
- **Ruled fields:** `.ruled` writing fields repeat `--color-ruled-rule` every 28px (27px transparent, 1px rule) — the one cadence for any ruled surface, day or night.
- **Density:** compact controls (32px buttons, 36px inputs) on a generous sheet; whitespace separates documents, not elements.
- **Focus:** visible `focus-visible` rings everywhere (`ring-ring/50`, 3px on buttons; 2px ring on inputs; ink-blue pointer on day sheet, powder at night).

## Elevation & Depth

Depth is **document layering**, not drop-shadow furniture. A sheet earns elevation by being the sheet you are reading: auth panes, the confirmation pad, the hero's day sheet, and carbon copies carry `shadow-md`/`shadow-lg` (soft, low-alpha black) over the desk ground. Resting cards and panels are flat — `bg-card` with a `ring-1 ring-border` hairline instead of shadow.

- **`shadow-md`**: the paper-sheet panes (auth panes, confirmation pad), selected time slots, floating desk notes.
- **`shadow-lg`**: the hero's day sheet (the front sheet), dialogs, mobile sheets.
- **Modal surfaces**: `bg-surface-container-low` (dialog, sheet) with `shadow-lg` and a hairline `border`.
- **Skeletons:** the day shimmer is neutral gray; the night desk replaces it with a tonal mix of the surface family (`color-mix(in oklch, ...)` of `surface-container-lowest`/`highest`) — the desk's placeholders are slate, not gray.

### Named Rules
**The Flat Sheet Rule.** Cards are flat at rest — hairline ring, no shadow. Elevation is reserved for sheets (paper in the hand), selection (the slot you picked), and floating notes — never for the sake of "popping" a card.

## Shapes

- **Geometry:** softly rounded, print-honest — no pill-everything, no sharp-corner minimalism. Radius base is `--radius: 0.5rem` (8px); the derived scale runs sm ≈5px → 4xl ≈21px.
- **Controls:** rounded-lg ≈8px (buttons `rounded-lg`; dense groups floor at `min(radius-md, 10px)`, i.e. ≈6-8px). Inputs and selects share it.
- **Cards:** rounded-xl ≈11px (computed `radius × 1.4`; shadcn `rounded-xl`), hairline ring border, 16px internal padding.
- **Sheets:** `paper-sheet` at `radius × 1.2` ≈10px — a hairline-inked sheet edge, not a card fold.
- **Stamp marks:** the `.stamp-ring` construct — 2px solid + 1px offset outline (5px) double border, 6px radius (or `rounded-full` for the seal) — a pressed rubber ring; stamps may sit askew (`-rotate-3`, `hover:-rotate-1`).
- **Badges/chips:** rounded-4xl pills (the `badge` primitive); tinted role chips at `bg-{role}/10 text-{role}` with 25% borders for role tags (e.g. the "Admin" tag, role badges).
- **Icon tiles:** squared-but-soft — `rounded-lg` 36-48px tint tiles (`bg-primary/10 text-primary`); avatar tiles `rounded-full`.

## Components

### Buttons
- **Character:** the stamp. Flat, decisive, squarish-soft (rounded-lg ≈8px); the default variant is a rubber stamp with no border.
- **Primary (default):** stamp-red fill, parchment text, 32px height, 12px horizontal padding, semibold 14px; the decisive actions also set `uppercase tracking-widest`. Hover darkens the stamp: `color-mix(in oklch, var(--primary), var(--background) 18%)`; focus ring 3px; active presses down 1px.
- **Outline:** parchment fill, hairline border, ink text; hover = `bg-muted`.
- **Secondary:** ink-blue (day) / powder (night) fill; hover mixes foreground 12%.
- **Ghost:** transparent, muted fill on hover — the theme toggle and drawer triggers.
- **Destructive:** never a solid red wall — `bg-destructive/10 text-destructive`, `hover:bg-destructive/20`.
- **Disabled:** 50% opacity, no pointer events.

### Theme Toggle (signature utility)
- **Shape:** ghost icon button (`size-7`, rounded-lg), moon and sun stacked absolute; the crossfade is the whole interaction — 300ms rotate/scale/opacity dance (`motion-reduce` disables it). It is a quiet stamp-ink moment, not a color event.
- **Placement:** header-right in AuthLayout, Navbar, and AdminNavbar; `aria-label` flips with mode ("Switch to light/dark theme"). No per-page theming — the whole document swings.

### Inputs / Fields
- **Character:** a line you fill in. 36px, rounded-lg, ink-stroke border (`--input`), paper background, `shadow-sm`; 14px text, muted placeholder.
- **Focus:** 2px `ring-ring` (ink blue day / powder night); error swaps border + ring to clinic red with `aria-invalid`.
- **Selects/search:** same stroke on `bg-surface-container-low`; search has a leading icon and ring-on-focus.

### Cards / Containers
- **Character:** flat sheets of stock. `bg-card`, `ring-1 ring-border`, rounded-xl ≈11px, 16px padding (`sm` cards 12px, `p-6` featured panels 24px).
- **Selection:** `border-primary/25 bg-primary/10 text-primary` tag recipe (role chips, the "Admin" tag); selected doctor/slot cards add `shadow-md` and a primary border.

### Navigation
- **Character:** desk chrome, not a menu wall. 56px headers with hairline rules; public Navbar is sticky and translucent; AdminNavbar sits on a paper layer. Active sidebar items: `bg-primary/10 text-primary` with a primary icon — the stamp marks where you are.
- **Mobile:** drawer = `bg-surface-container-low`, same hairline language.

### Paper Sheet (signature document)
- **Anatomy:** the recurring document — letterhead row (Rx mark + wordmark, `letterhead-rule` double rule beneath), `heading-1` title, ruled or plain fact rows with `tabular` values, and a `stamp-ring` verdict ("Booked") or a stamp button. A carbon copy floats behind at ±2° rotation (`rotate-1/2`, `border/70`, `opacity-60/70`).
- **Where it lands:** the landing hero sheet, auth panes, appointment confirmation, weekly calendar cards.

### Step Wizard / Slot Picker
- Steps as a written list: completed steps in print-ink with `tabular` numerals ("01, 02..."), the current step stamped in primary with a `BiroCircle` pen-glyph on its corner. Slots are stamps: the selected slot is a solid red stamp (`bg-primary text-primary-foreground shadow-md`); free slots read as green availability.

## Do's and Don'ts

### Do:
- **Do** open on the night desk and let the ThemeToggle swing the whole document at once — never theme a single page.
- **Do** write every important number tabular: fees, times, dates, references, phones.
- **Do** use the stamp-red fill for the one decisive action per surface — elsewhere the accent is a tinted tag or an icon, not a wall of red.
- **Do** compose confirmations as documents: letterhead rule, sheet, `stamp-ring` verdict, carbon copy.
- **Do** keep the ruled cadence at 28px with the mode-appropriate `--color-ruled-rule` token.
- **Do** let the night desk stay slate: muted fills and placeholders derive from the surface family, not neutral gray.

### Don't:
- **Don't** introduce a second text family for UI copy; Kalam is the hand, and the hand only annotates.
- **Don't** shadow a resting card to make it pop — hairline ring, and elevation only for sheets, selection, and floating notes.
- **Don't** render destructive actions as a solid red button — tinted fill, red text.
- **Don't** surface an action the workflow cannot perform (no booking buttons on past dates, no reviews before completion) — inventing affordances is a lie on the document.
- **Don't** duplicate the day-sheet values into `.dark` or ship a third mode — the pad is one document with two ink/paper states.
- **Don't** add an oversized display register; the page-sheet title (24px) is the top of the hierarchy.