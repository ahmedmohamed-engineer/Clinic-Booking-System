import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/config";
import { buildContentSecurityPolicy, generateCspNonce } from "./lib/csp";

/**
 * Locale negotiation at the edge + per-request nonce-based CSP.
 *
 * With `localePrefix: "as-needed"` every user request is rewritten onto the
 * matching locale segment: `/login` serves the default English locale and
 * `/ar/login` serves Arabic — one page tree, one set of routes, two dialects
 * of it. Locale switches never do a full navigation; the client navigation
 * helpers handle that in the browser.
 *
 * Each request also mints a fresh cryptographic nonce. The nonce is placed
 * in a `Content-Security-Policy` (enforce) header on the response AND on the
 * forwarded request (as both `x-nonce` and the CSP header), so Next.js stamps
 * it onto its own inline bootstrap scripts during server rendering. The
 * request headers survive the locale rewrite because next-intl's middleware
 * forwards the headers of the request it was given.
 */
const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const nonce = generateCspNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = intlMiddleware(
    new NextRequest(request.url, { headers: requestHeaders }),
  );
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  // Run on everything except internal Next assets, API routes and
  // dot-files. The `.*\\..*` arm excludes any URL that carries a file
  // extension (public assets like /favicon.ico or /images/hero.png).
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
