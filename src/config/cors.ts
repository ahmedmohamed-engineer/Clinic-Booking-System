/**
 * CORS allow-list resolution.
 *
 * Development is deliberately permissive: with no `CORS_ORIGINS` configured
 * the backend falls back to the local frontend origin, matching the previous
 * behavior so local tooling keeps working without a config file.
 *
 * Production is fail-safe: a missing or invalid `CORS_ORIGINS` is a
 * configuration error and must stop the server rather than silently fall back
 * to a development origin (which would expose the API to unintended browser
 * origins or silently no-op the allow-list).
 */

const DEV_FALLBACK_ORIGIN = "http://localhost:3000";

function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveAllowedOrigins(
  nodeEnv: string,
  corsOrigins: string | undefined,
): string[] {
  const entries = (corsOrigins ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    if (nodeEnv === "production") {
      throw new Error(
        "CORS_ORIGINS is required in production. Refusing to start with an empty CORS allow-list.",
      );
    }
    return [DEV_FALLBACK_ORIGIN];
  }

  if (nodeEnv === "production") {
    const invalid = entries.filter((origin) => !isHttpOrigin(origin));
    if (invalid.length > 0) {
      throw new Error(
        `CORS_ORIGINS contains invalid http(s) origins: ${invalid.join(", ")}`,
      );
    }
  }

  return entries;
}