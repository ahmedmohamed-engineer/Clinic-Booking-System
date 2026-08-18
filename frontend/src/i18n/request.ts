import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "./config";

/**
 * Request-scoped i18n configuration.
 *
 * Loads the message catalog for the resolved locale and hands it to both
 * the server-side rendering (layout, metadata, server components) and, via
 * `NextIntlClientProvider` in the root layout, every client component.
 *
 * The messages are imported lazily per locale so a build never ships the
 * catalog it does not render. An unknown segment in the `[locale]` slot
 * escalates to the localized not-found page rather than a silent fallback.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!hasLocale(routing.locales, requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: (await import(`../../messages/${requested}.json`)).default,
  };
});