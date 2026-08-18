import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPathActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href.endsWith("/") ? href : `${href}/`);
}

export function getInitials(name: string): string {
  const normalized = name.trim();
  if (!normalized) return "?";
  if (normalized.includes("@")) {
    return normalized.slice(0, 2).toUpperCase();
  }
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Returns a human-readable display name for a profile.
 * Picks the first real-looking name from the candidates (skipping values that
 * are just the email's local part, e.g. "as" for "as@hh.com"), then falls back
 * to the email, then to any non-empty candidate, then to a default label.
 */
export function resolveDisplayName(
  names: Array<string | null | undefined>,
  email?: string | null,
  fallback = "User",
): string {
  const mailbox = email?.split("@")[0]?.toLowerCase();

  for (const name of names) {
    const trimmed = name?.trim();
    if (trimmed && (!mailbox || trimmed.toLowerCase() !== mailbox)) {
      return trimmed;
    }
  }

  if (email?.trim()) return email.trim();

  for (const name of names) {
    const trimmed = name?.trim();
    if (trimmed) return trimmed;
  }

  return fallback;
}

export const APP_TIMEZONE = "Africa/Cairo";
export const APP_LOCALE = "en-EG";

/**
 * Maps a next-intl locale to the ICU locale used for date/time/number
 * rendering. Arabic keeps the Latin digit set (`-u-nu-latn`) so numbers
 * stay tabular and consistent with data-driven values (phones, fees,
 * references) — only the month/day names and AM/PM markers switch to
 * Arabic.
 */
const ICU_LOCALES: Record<string, string> = {
  en: "en-EG",
  ar: "ar-EG-u-nu-latn",
};

function resolveIcuLocale(locale?: string): string {
  if (!locale) return APP_LOCALE;
  return ICU_LOCALES[locale] ?? locale;
}

export function formatDate(date: string | Date, locale?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat(resolveIcuLocale(locale), {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(d);
  const value: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") value[part.type] = part.value;
  }
  return `${value.day} ${value.month} ${value.year}`;
}

export function formatDateTime(
  date: string | Date,
  time: string,
  locale?: string,
): string {
  return `${formatDate(date, locale)} • ${formatTime(time, locale)}`;
}

export function formatCurrency(amount: number, locale?: string): string {
  return new Intl.NumberFormat(resolveIcuLocale(locale), {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatTime(time: string, locale?: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  if (locale && locale !== "en") {
    // Arabic meridiem markers (ص / م) and localized numerals, Latin digits
    // kept for the tabular-numerals rule.
    const d = new Date(2000, 0, 1, h, parseInt(minutes, 10) || 0);
    return new Intl.DateTimeFormat(resolveIcuLocale(locale), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }
  return `${hour12}:${minutes} ${ampm}`;
}

export function toHHmm(time: string): string {
  return time.slice(0, 5);
}

// Reused per-timezone formatters: constructing an Intl.DateTimeFormat on every
// call is ~25× slower than reusing one (measured ~211µs vs ~8µs per call).
// toISODateString runs on every render of date-sensitive surfaces (slot picker,
// booking wizard, forms), so the cached instance is a real interaction win.
const isoDateFormatters = new Map<string, Intl.DateTimeFormat>();

export function toISODateString(date: Date, timeZone = APP_TIMEZONE): string {
  let formatter = isoDateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    isoDateFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const value: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") value[part.type] = part.value;
  }
  return `${value.year}-${value.month}-${value.day}`;
}
