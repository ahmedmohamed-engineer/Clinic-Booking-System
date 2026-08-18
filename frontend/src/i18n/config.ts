import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for MediCare.
 *
 * The default locale (English) is served without a prefix (`/dashboard`),
 * while alternate locales carry their own prefix (`/ar/dashboard`). The
 * prefix is therefore "as-needed": English keeps the historical URLs the
 * production deployment already ranks for, and Arabic gets a clean,
 * crawlable namespace.
 */
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export function isRtlLocale(locale: string): boolean {
  return locale === "ar";
}