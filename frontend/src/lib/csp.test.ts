import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, generateCspNonce } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("stamps the per-request nonce into script-src", () => {
    const csp = buildContentSecurityPolicy("abc123");
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it("never allows unsafe-inline or unsafe-eval for scripts", () => {
    const csp = buildContentSecurityPolicy(generateCspNonce());
    const scriptSrc = csp.split(";").find((d) => d.includes("script-src"));
    expect(scriptSrc).toBeTruthy();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("keeps the configured API origin in img-src and connect-src", () => {
    const previous = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    try {
      const csp = buildContentSecurityPolicy("n");
      expect(csp).toContain(
        "img-src 'self' data: blob: 'self' https://api.example.com",
      );
      expect(csp).toContain("connect-src 'self' https://api.example.com");
    } finally {
      process.env.NEXT_PUBLIC_API_URL = previous;
    }
  });

  it("falls back to 'self' when no API origin is configured", () => {
    const previous = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "";
    try {
      const csp = buildContentSecurityPolicy("n");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).not.toContain("undefined");
    } finally {
      process.env.NEXT_PUBLIC_API_URL = previous;
    }
  });

  it("keeps the unchanged hardening directives", () => {
    const csp = buildContentSecurityPolicy("n");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("font-src 'self' data:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe("generateCspNonce", () => {
  it("returns a unique nonce per call", () => {
    expect(generateCspNonce()).not.toBe(generateCspNonce());
  });

  it("produces a CSPRNG-sourced base64url token", () => {
    const nonce = generateCspNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(nonce.length).toBeGreaterThanOrEqual(20);
  });
});
