import type { QueryKey } from "@tanstack/react-query";
import { queryClient } from "./query-client";

export interface PrefetchOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;
}

/**
 * Best-effort data prefetch for the admin dashboard.
 *
 * Prefetching must never create a request storm when the backend is down:
 * - retries are disabled (the global QueryClient default is `retry: 1`), so a
 *   single hover/focus cannot multiply into two network calls;
 * - a query that already failed is not re-fired. TanStack caches the error
 *   state for the query's gcTime, so this bounds a failing backend to one
 *   attempt per key instead of re-hitting it on every hover. The real page
 *   query still fetches fresh data when the user navigates there.
 *
 * Successful-cache deduplication is preserved: an in-flight or fresh query
 * within `staleTime` is resolved from the cache without a new request.
 */
export function prefetchAdminQuery<T>({
  queryKey,
  queryFn,
  staleTime,
}: PrefetchOptions<T>): void {
  if (queryClient.getQueryState(queryKey)?.status === "error") {
    return;
  }

  void queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
    retry: false,
  });
}