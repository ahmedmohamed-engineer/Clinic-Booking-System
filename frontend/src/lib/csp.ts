/**
 * Nonce-based Content-Security-Policy for the Prescription Pad.
 *
 * The policy is ENFORCED (not report-only) and built per-request in
 * `src/proxy.ts`: a fresh cryptographic nonce is minted for every document
 * request, stamped into both the `Content-Security-Policy` response header
 * and the `x-nonce` request header that Next.js reads while server-rendering,
 * so the framework's own inline bootstrap scripts carry the nonce
 * automatically (see the Next.js CSP guide for the App Router).
 *
 * `script-src` intentionally has no `'unsafe-inline'` and no `'unsafe-eval'`:
 * inline scripts are allowed only with the per-request nonce, plus
 * `'strict-dynamic'` so the nonce-trusted bootstrap script can load the
 * dynamically imported client chunks. `style-src` keeps `'unsafe-inline'`
 * because components (date-picker, fonts) legitimately set inline style
 * attributes; `script-src` is the XSS-critical surface F-2 hardens.
 */

function resolveApiSources(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return "'self'";
  try {
    return ["'self'", new URL(raw).origin].filter(Boolean).join(" ");
  } catch {
    return "'self'";
  }
}

export function buildContentSecurityPolicy(nonce: string): string {
  const apiSources = resolveApiSources();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Inline style attributes set by components/date-picker.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${apiSources}`,
    `connect-src ${apiSources}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Fresh CSPRNG nonce (16 random bytes, base64url) for one request. */
export function generateCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
