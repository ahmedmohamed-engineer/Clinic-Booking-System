import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/lib/query-client";
import { prefetchAdminQuery } from "@/lib/prefetch";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
});

describe("prefetchAdminQuery", () => {
  it("forwards query options to the QueryClient with retries disabled", async () => {
    const spy = vi.spyOn(queryClient, "prefetchQuery");
    queryClient.setQueryData(["key"], { ok: true });

    prefetchAdminQuery({
      queryKey: ["key"],
      queryFn: async () => ({ ok: true }),
      staleTime: 60_000,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const [options] = spy.mock.calls[0];
    expect(options.retry).toBe(false);
  });

  it("does not refire a prefetch whose query already failed (bounded storm)", async () => {
    const fetchSpy = vi.spyOn(queryClient, "fetchQuery");
    // Prime the cache with a failed query (same as a failed prefetch leaving
    // an error state behind).
    await queryClient
      .fetchQuery({
        queryKey: ["book", "slots"],
        queryFn: async () => {
          throw new Error("backend unavailable");
        },
        retry: false,
      })
      .catch(() => {});

    const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");
    const failingFn = vi.fn(async () => {
      throw new Error("backend unavailable");
    });

    prefetchAdminQuery({
      queryKey: ["book", "slots"],
      queryFn: failingFn,
      staleTime: 60_000,
    });
    prefetchAdminQuery({
      queryKey: ["book", "slots"],
      queryFn: failingFn,
      staleTime: 60_000,
    });
    prefetchAdminQuery({
      queryKey: ["book", "slots"],
      queryFn: failingFn,
      staleTime: 60_000,
    });

    expect(prefetchSpy).toHaveBeenCalledTimes(0);
    expect(failingFn).not.toHaveBeenCalled();
    void fetchSpy;
  });

  it("exhausts a failed prefetch to a single attempt per key", async () => {
    const queryFn = vi.fn(async () => {
      throw new Error("backend unavailable");
    });

    // First attempt fails and leaves an error state on the key.
    await expect(
      queryClient.fetchQuery({
        queryKey: ["schedules", "admin", { page: 1, limit: 100 }],
        queryFn,
        retry: false,
      }),
    ).rejects.toThrow("backend unavailable");
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Every later prefetch for the same key is a cache hit on the error state.
    for (let i = 0; i < 5; i++) {
      prefetchAdminQuery({
        queryKey: ["schedules", "admin", { page: 1, limit: 100 }],
        queryFn,
        staleTime: 60_000,
      });
    }
    await sleep(10);

    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("preserves successful fresh-cache deduplication", async () => {
    const queryFn = vi.fn(async () => ({ ok: true }));
    queryClient.setQueryData(["doctors"], [{ id: "1" }]);
    // A recent setQueryData is fresh; prefetch must resolve from cache.
    prefetchAdminQuery({ queryKey: ["doctors"], queryFn, staleTime: 120_000 });
    await sleep(10);

    expect(queryFn).not.toHaveBeenCalled();
  });

  it("re-fetches a stale successful query (cache dedup only within staleTime)", async () => {
    const queryFn = vi.fn(async () => ({ ok: true }));
    queryClient.setQueryData(["clinics"], [{ id: "1" }], { updatedAt: 0 });

    prefetchAdminQuery({
      queryKey: ["clinics"],
      queryFn,
      staleTime: -1, // force everything stale
    });
    await sleep(10);

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});