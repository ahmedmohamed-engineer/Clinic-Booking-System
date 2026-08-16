---
name: MediCare
description: Healthcare appointment booking — calm, trustworthy, zero-friction.
colors:
  primary: "#0f6cbd"
  on-primary: "#ffffff"
  primary-container: "#dbeafe"
  secondary: "#0fb9a6"
  on-secondary: "#062e27"
  tertiary: "#7c3aed"
  on-tertiary: "#ffffff"
  neutral-background: "#f8fafc"
  neutral-on-surface: "#0f172a"
  neutral-on-surface-variant: "#64748b"
  neutral-surface-container-lowest: "#ffffff"
  neutral-surface-container-high: "#f1f5f9"
  neutral-outline: "#94a3b8"
  error: "#dc2626"
  success: "#16a34a"
  warning: "#d97706"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 2rem
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.05em"
    textTransform: "uppercase"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, var(--primary), var(--foreground) 20%)"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  input-text:
    backgroundColor: "{colors.neutral-background}"
    textColor: "{colors.neutral-on-surface}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "4px 12px"
    borderColor: "{colors.border}"
  card-default:
    backgroundColor: "{colors.neutral-surface-container-lowest}"
    textColor: "{colors.neutral-on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: MediCare

## Overview

**Creative North Star: "The Calm Clinic"**

MediCare is a healthcare product, and it looks like one: calm, considered, and clinical in the best sense — precise, legible, and reassuring. Patients arrive when they are unwell or pressed for time, so nothing about the interface is allowed to alarm, crowd, or second-guess them. The visual language is **confident flatness**: generous spacing, low-contrast hairline borders, soft tonal surfaces, and color used deliberately — a single committed primary doing the heavy lifting, with status colors reserved for meaning (green = ok, amber = wait, red = stop).

The system is **utilitarian-precise**: buttons, cards, and inputs are compact (32px control height), radius is gently curved (8px standard, 14px for cards), and typography is one family — Inter — whose display weight carries emphasis instead of a second font. The aesthetic philosophy is "premium healthcare software": closer to Strip-era calm SaaS than to decorative health-and-wellness styling. Atmospheric gradients and soft glows appear sparingly, in the public landing experience only; authenticated work surfaces stay flat and quiet.

The incumbent rulebook (product owner's design standard, `frontend/docs/reports/skillsUIUX/design-system.md`) is binding on this world: trust and clarity over decorative convenience, never invent actions the product cannot perform, every screen answers "where am I / what is happening / what should I do next / what is most important / what happened before" in that order.

**Key Characteristics:**
- One typeface (Inter); hierarchy through weight, size, and case, not font family.
- Flat, tonal surfaces with hairline ring borders; shadows only as state response (hover, selected).
- Compact controls throughout: 32px default buttons, 36px inputs.
- A single committed primary blue; status colors carry semantic meaning only.
- Radius vocabulary: 8px controls, 10px standard, 14px cards, full pill for badges.
- Dark mode: toggle and token block exist, but the `.dark` token values currently mirror `:root` — the dark theme has no distinct visual yet (see Colors note).

## Colors

A cool slate-and-blue system with a teal secondary: the classic "trusted medical" register — blue for action, teal for reassurance, amber/red only when a status demands it.

### Primary
- **MediCare Blue** (#0f6cbd): the single accent. Primary buttons, links, selected states, focus rings, interactive icons, booking-wizard active steps. Used sparingly — it should feel committed, not everywhere.
- **On Primary** (#ffffff): text/icon color on primary fills.
- **Primary Container** (#dbeafe): soft selected/tinted backgrounds (e.g. `bg-primary/5`-style containers, selected doctor cards).

### Secondary
- **Calm Teal** (#0fb9a6): secondary buttons, secondary icon moments, the "modern care" reassurance accent. Always paired with **On Secondary** (#062e27).

### Tertiary
- **Focus Violet** (#7c3aed): chart/visualization accents only (charts 3+), per the token map. Not an interface action color.

### Neutral
- **Snow Slate** (#f8fafc): page background.
- **Pure Surface** (#ffffff): cards, popovers, sidebars, surface containers.
- **Ink Slate** (#0f172a): primary text (on-surface/foreground).
- **Slate Muted** (#64748b): secondary text, placeholders, muted labels (on-surface-variant / muted-foreground).
- **Soft Slate** (#f1f5f9): hover fills, muted section backgrounds, table zebra strips (surface-container-high / muted).
- **Hairline** (#e2e8f0): borders and input strokes (border / input).
- **Outline Slate** (#94a3b8): outline and divider roles.

### Status
- **Calm Green** (#16a34a): success, available, paid, completed.
- **Amber** (#d97706): pending, warning.
- **Alert Red** (#dc2626): error, destructive, cancelled, failed.
- **Slate Neutral** (#64748b): informational-neutral (no_show, refunded) states.

### Named Rules
**The One Accent Rule.** MediCare Blue is the only action accent. Teal is secondary, violet is charts-only, and status colors never decorate — a green or red appears only when a status genuinely requires it.
**The Tonal Reading Rule.** Neutrals are expressed as a surface-container family (lowest → highest) rather than shadows; depth is read from tone, not from elevation.

> **Dark mode note (honest state):** the theme provider toggles a `.dark` class and the token block exists, but its values currently duplicate the light palette, so dark mode renders identically to light. The system documents light mode as normative until a real dark palette is decided.

## Typography

**Display Font:** Inter (via `next/font/google`, `--font-inter`, with ui-sans-serif/system-ui fallbacks)
**Body Font:** Inter (same family)
**Label Font:** Inter (weights/case carry the distinction)

**Character:** A single sans-serif family, structured like a clinical interface: tight display headlines with negative tracking, medium-weight titles, small 14px text, and uppercase-tracking micro-labels (the `.heading-2` pattern: 12px, 500, +0.05em, uppercase). Emphasis is volumetric — weight, size, and case — never a second font.

### Hierarchy
- **Display** (700, clamp(2.25rem→3.25rem), 1.1): landing-page hero headlines only ("Your health journey, simplified"). Negative tracking (-0.02em).
- **Headline** (600, 1.5rem/24px, 2rem): page-section headings, `.heading-1`.
- **Title** (500–600, 1rem/16px, 1.375): card titles (`CardTitle`, font-heading), in-page titles.
- **Body** (400, 0.875rem/14px, 1.5): default text size for cards, tables, forms, `.body-text`. Body copy in muted slate (#475569 in the `.body-text` utility).
- **Label** (500, 0.75rem/12px, +0.05em, uppercase): micro-labels, section eyebrows (`.heading-2` utility).

### Named Rules
**The One Family Rule.** Inter everywhere. A second family is a redesign decision, never a local accent.

## Layout

- **Container:** `container-custom` — max-width 1280px, center-aligned, 16px side padding on mobile, 24px at ≥640px, 32px at ≥1024px.
- **Spacing rhythm:** 8px base unit; the working rhythm is 12/16/24/32px (gap-3/4/6/8). Cards pad at 16px (`CardContent` p-6 style spacing used on featured cards; default `--card-spacing` is 16px, compact cards 12px).
- **Density:** compact by default — a 32px button + 36px input + 14px text surface reads dense-but-calmed; generous whitespace separates *sections*, not elements.
- **Responsive behavior:** mobile-first stacking; landing hero converts from centered column to a two-column row at `lg`; floating confirmation chips appear only ≥640px. Administrative chrome persists with sidebar navigation on desktop.
- **Focus:** visible focus rings (`ring-2`/`ring-3` ring color) on all interactive elements — WCAG 2.1 AA focus visibility is part of the layout contract.

## Elevation & Depth

The system is **flat by default**. Cards are defined by `ring-1 ring-foreground/10` hairline borders over white-on-slate tonal surfaces, not by drop shadows. Depth is tonal: surface-container-lowest (white) sits on surface-container-low (slate) and high/highest (deeper slate) — see **The Tonal Reading Rule**.

Shadows appear only as a state response:
- **Selected state** (`shadow-md`): selected doctor cards and active wizard steps.
- **Floating elements** (`shadow-lg`/`shadow-2xl`): the landing hero's mock booking card and its floating confirmation chips.
- **Modals/sheets**: elevated with shadow per the dialog primitive.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest; an element earns its shadow by being selected, floating, or modal — never just for being a card.

## Shapes

- **Radius base:** 0.625rem (10px); the scale derives from it — sm ≈6px, md ≈8px, lg 10px, xl ≈14px, 2xl ≈18px, 3xl/4xl up to 26px.
- **Controls (buttons, inputs, selects):** rounded-md ≈8px, with a `min(radius-md, 10px)` floor for dense control groups.
- **Cards:** rounded-xl ≈14px; nested images clip to their card's corners.
- **Badges/chips:** full pill (rounded-full) with 1px border at 25% status-tone alpha over a 10% tinted background.
- **Square-ish interactions:** avatar tiles rounded-2xl ≈18px; landing icons rounded-2xl; the hero mock card rounded-3xl (2.2× base ≈22px).

## Components

### Buttons
- **Shape:** compact rounded-md ≈8px; no border on the primary (border-transparent base), outline variant carries the hairline.
- **Primary:** MediCare Blue fill, white text, 32px height (lg 36px), 10–12px horizontal padding, text-sm/500. Hover darkens via `color-mix(in oklch, primary, foreground 20%)`.
- **Secondary:** Calm Teal fill with dark teal text; hover mixes 5% foreground.
- **Outline:** white/snow fill, hairline border, slate text; hover = muted fill.
- **Ghost:** transparent, muted fill on hover.
- **Destructive:** tinted red (`destructive/10` fill + red text), never a solid red wall.
- **Focus/hover:** `focus-visible:ring-3 ring-ring/50` ring; active presses translate down 1px. Disabled: 50% opacity, no pointer events.

### Status Badges (chips)
- **Style:** pill, 1px border at 25% alpha + 10% tinted fill of the status tone; 12px medium text, capitalized ("Scheduled" → "No show").
- **Tone map:** available/paid/completed/success → green; scheduled/confirmed/booked → blue; pending → amber; cancelled/failed → red; no_show/refunded → neutral slate.

### Cards / Containers
- **Corner Style:** rounded-xl ≈14px.
- **Background:** white (`surface-container-lowest` / `bg-card`); selected cards tint `bg-primary/5` with a 2px primary border.
- **Shadow Strategy:** hairline ring at rest; `shadow-md` only when selected.
- **Internal Padding:** 16px default (`--card-spacing` 16px; `sm` cards 12px); featured domain cards (DoctorCard) pad at 24px (p-6).

### Inputs / Fields
- **Style:** 36px height, rounded-lg ≈10px, hairline border, snow background, `shadow-sm`; 14px text, muted placeholder.
- **Focus:** 2px ring in primary blue; destructive state swaps border + ring to alert red with `aria-invalid`.
- **Error/Disabled:** `hasError` → red border + red focus ring; disabled → 50% opacity, not-allowed cursor.

### Navigation
- Top navbar and admin sidebar use white surface, ink text, primary blue for active indicators; sidebar accent uses `muted` fills with ink foreground. Client-side guards protect routes; the public header is minimal with outline/solid button pair.

### Doctor Card (signature)
- **Anatomy:** 64px rounded avatar (graceful fallback initials), doctor name (semibold), specialty link-row in primary, clinic, experience, and fee (semibold, with a primary dollar icon), rating via amber star row, 2-line clamped bio.
- **States:** hover lifts with a primary border; selected = 2px primary border + primary/5 tint + `shadow-md`; keyboard selectable (`role="button"`, Enter/Space) — this is the booking wizard's decision point and the state pattern to preserve.

### Slot Picker / Weekly Calendar
- Time slots as tappable pills; slot availability reads from real data (green = available, neutral = taken); the weekly calendar (`/schedule`) renders recurring time blocks per weekday with slot-duration labels. (Detail-level patterns live in these components; design intent: availability must be scannable at a glance.)

## Do's and Don'ts

### Do:
- **Do** lead each screen with the answer to "where am I / what's happening / what do I do next" (page title, current state, primary action — in that visual order).
- **Do** keep cards quiet: hairline ring, white fill, primary border only for selection or emphasis.
- **Do** use the status tint recipe — 10% fill / 25% border of a single status tone — for every badge.
- **Do** reserve the display type size for the landing hero; in-product hierarchy tops out at `heading-1`.
- **Do** ship real data and honest states: real clinics, doctors, fees, availability; skeleton/empty/error states only ever show demo content, never invented business facts.
- **Do** verify focus visibility on every interactive element (WCAG 2.1 AA scope).

### Don't:
- **Don't** introduce a second font family or a new accent color as a local flourish — both are system-level decisions.
- **Don't** shade or shadow a card to make it "pop"; use the tonal surface family and the hairline ring instead.
- **Don't** use status colors decoratively (no green checkmarks for cosmetic success, no red for flavor).
- **Don't** surface an action the workflow cannot perform (no booking buttons on past dates, no reviews before completion) — inventing affordances is a product lie.
- **Don't** duplicate light token values into `.dark` and call it dark mode — a real dark palette is pending, not present.