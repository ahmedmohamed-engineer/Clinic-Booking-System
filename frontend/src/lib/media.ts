import { API_BASE_URL } from "@/config";

function resolveApiOrigin(): string {
  try {
    const url = new URL(API_BASE_URL, "http://localhost");
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = resolveApiOrigin();
  if (!origin) return undefined;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}