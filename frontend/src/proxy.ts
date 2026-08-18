import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/config";

/**
 * Locale negotiation at the edge.
 *
 * With `localePrefix: "as-needed"` this rewrites every user request onto
 * the matching locale segment: `/login` serves the default English locale
 * and `/ar/login` serves Arabic — one page tree, one set of routes, two
 * dialects of it. Locale switches never do a full navigation; the client
 * navigation helpers handle that in the browser.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`; the file must
 * live at `proxy.ts` (or `src/proxy.ts`) and export a function named
 * `proxy`. `createMiddleware` from next-intl returns exactly that shape.
 */
const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Run on everything except internal Next assets, API routes and
  // dot-files. The `.*\\..*` arm excludes any URL that carries a file
  // extension (public assets like /favicon.ico or /images/hero.png).
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
