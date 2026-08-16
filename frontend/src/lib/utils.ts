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

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat(APP_LOCALE, {
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

export function formatDateTime(date: string | Date, time: string): string {
  return `${formatDate(date)} • ${formatTime(time)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
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
