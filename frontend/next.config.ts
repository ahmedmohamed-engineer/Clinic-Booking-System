import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The advertising header adds nothing functional and trivially leaks the
  // framework + version; removing it is free and quiet.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The Content-Security-Policy itself is no longer generated here:
          // it is ENFORCED per request from `src/proxy.ts`, which mints a
          // fresh nonce and lets Next.js stamp it onto its inline bootstrap
          // scripts (see `src/lib/csp.ts`). The remaining headers below are
          // static hardening that needs no per-request state.
          // Frame-busting fallback for consumers that ignore CSP.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Browsers ignore HSTS over plain http (dev), so it is safe to
          // send unconditionally; it locks down https in production.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  turbopack: {
    root: __dirname,
  },
};

// Wires the i18n request configuration (locale resolution + message
// loading) into the App Router's server-side rendering pipeline.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);