import { createNavigation } from "next-intl/navigation";
import { routing } from "./config";

/**
 * Locale-aware navigation helpers.
 *
 * These wrap Next's own `Link`, `useRouter` and `usePathname` so every
 * link keeps the visitor in their current locale: on `/ar/dashboard`, a
 * `Link href="/book"` renders `/ar/book`, and an English visitor clicking
 * the same component gets `/book`. No call site needs to know about the
 * prefix — that is this module's job.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);