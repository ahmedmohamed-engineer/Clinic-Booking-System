import { notFound } from "next/navigation";

/**
 * Catch-all inside the locale tree: any unknown path under a resolved
 * locale (e.g. /ar/unknown or /unknown) escalates to the localized
 * not-found page instead of the framework's bare 404.
 */
export default function CatchAllPage() {
  notFound();
}