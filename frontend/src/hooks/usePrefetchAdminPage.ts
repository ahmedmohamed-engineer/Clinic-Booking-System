"use client";

import { useCallback, useEffect, useRef } from "react";
import { prefetchAdminQuery } from "@/lib/prefetch";
import { STALE_TIMES } from "@/config";

interface UsePrefetchAdminPageOptions<TParams> {
  queryKey: (params: TParams) => readonly unknown[];
  queryFn: (params: TParams) => Promise<unknown>;
  params: TParams;
  page: number;
  totalPages: number;
  staleTime?: number;
}

export function usePrefetchAdminPage<TParams extends { page?: number }>({
  queryKey,
  queryFn,
  params,
  page,
  totalPages,
  staleTime = STALE_TIMES.adminLists,
}: UsePrefetchAdminPageOptions<TParams>) {
  const latestRef = useRef({ queryKey, queryFn, params });
  useEffect(() => {
    latestRef.current = { queryKey, queryFn, params };
  }, [queryKey, queryFn, params]);

  const prefetchPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      const targetParams = { ...latestRef.current.params, page: targetPage } as TParams;
      prefetchAdminQuery({
        queryKey: latestRef.current.queryKey(targetParams),
        queryFn: () => latestRef.current.queryFn(targetParams),
        staleTime,
      });
    },
    [totalPages, staleTime],
  );

  useEffect(() => {
    prefetchPage(page + 1);
  }, [prefetchPage, page]);

  return prefetchPage;
}
