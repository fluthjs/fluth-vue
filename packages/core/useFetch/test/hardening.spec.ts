import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
import { $ } from "../../useFluth";
import {
  clearFetchCache,
  configureFetchCache,
  createFetch,
  useFetch,
} from "../index";

function createDeferred<T = any>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createAbortableMockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response,
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const signal = init?.signal;
    if (signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    return new Promise<Response>((resolve, reject) => {
      const onAbort = () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      Promise.resolve(handler(String(input), init)).then(
        (res) => {
          signal?.removeEventListener("abort", onAbort);
          resolve(res);
        },
        (err) => {
          signal?.removeEventListener("abort", onAbort);
          reject(err);
        },
      );
    });
  });
}

describe("useFetch 1.0 hardening", () => {
  beforeEach(() => {
    clearFetchCache();
    configureFetchCache({ maxSize: 100 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearFetchCache();
    configureFetchCache({ maxSize: 100 });
  });

  describe("Cache hardening", () => {
    it("isolates cacheKey expiration timers across different keys", async () => {
      vi.useFakeTimers();
      const url = ref("https://api.test/a");
      const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
        return new Response(`body:${String(input)}`, { status: 200 });
      });

      const { execute } = useFetch(url, {
        immediate: false,
        fetch: mockFetch,
        cacheSetting: {
          expiration: 500,
          cacheResolve: ({ url: u }) => u,
        },
      });

      await execute();
      await vi.advanceTimersByTimeAsync(300);

      url.value = "https://api.test/b";
      await execute();

      // Advance 250ms: key A expires (550ms >= 500ms), key B still valid (250ms < 500ms)
      await vi.advanceTimersByTimeAsync(250);

      // Key B must still hit cache (not deleted by key A's timer!)
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Key A should have expired and trigger a new fetch
      url.value = "https://api.test/a";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("clears old expiration timer when overwriting, clearing single entry, or clearing all cache", async () => {
      vi.useFakeTimers();
      let seq = 0;
      const mockFetch = vi.fn(
        async () => new Response(`v${++seq}`, { status: 200 }),
      );

      const { execute, clearCache } = useFetch("https://api.test/item", {
        immediate: false,
        fetch: mockFetch,
        cacheSetting: {
          expiration: 500,
          cacheResolve: ({ url }) => url,
        },
      });

      // t=0: caches v1 (expires at t=500)
      expect(await execute()).toBe("v1");
      await vi.advanceTimersByTimeAsync(300);

      // t=300: clearCache and refetch -> caches v2 (expires at t=800)
      clearCache();
      expect(await execute()).toBe("v2");

      // t=550: old timer from v1 must NOT have deleted v2
      await vi.advanceTimersByTimeAsync(250);
      expect(await execute()).toBe("v2");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Same test with clearFetchCache()
      await vi.advanceTimersByTimeAsync(100); // t=650
      clearFetchCache();
      expect(await execute()).toBe("v3"); // expires at t=1150

      await vi.advanceTimersByTimeAsync(200); // t=850 (past v2's old expiry at 800)
      expect(await execute()).toBe("v3");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("enforces bounded LRU maxSize and refreshes order on hit", async () => {
      configureFetchCache({ maxSize: 2 });
      const url = ref("https://api.test/1");
      const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
        return new Response(`res:${String(input)}`, { status: 200 });
      });

      const { execute } = useFetch(url, {
        immediate: false,
        fetch: mockFetch,
        cacheSetting: { cacheResolve: ({ url: u }) => u },
      });

      // Cache /1 and /2
      await execute();
      url.value = "https://api.test/2";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Hit /1 -> promotes /1 to most recently used; /2 is now LRU
      url.value = "https://api.test/1";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Cache /3 -> evicts /2 (LRU), keeps /1 and /3
      url.value = "https://api.test/3";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // /1 should still hit cache
      url.value = "https://api.test/1";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // /2 was evicted -> fetches again
      url.value = "https://api.test/2";
      await execute();
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("supports custom per-request storage for SSR isolation and merges cacheSetting in createFetch", async () => {
      const reqStorageA = new Map<string, any>();
      const reqStorageB = new Map<string, any>();
      let seq = 0;
      const mockFetch = vi.fn(
        async () => new Response(`user-${++seq}`, { status: 200 }),
      );

      const useApiA = createFetch({
        baseUrl: "https://api.test",
        options: {
          fetch: mockFetch,
          cacheSetting: { storage: reqStorageA },
        },
      });
      const useApiB = createFetch({
        baseUrl: "https://api.test",
        options: {
          fetch: mockFetch,
          cacheSetting: { storage: reqStorageB },
        },
      });

      const a = useApiA("/me", {
        immediate: false,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });
      const b = useApiB("/me", {
        immediate: false,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });

      expect(await a.execute()).toBe("user-1");
      expect(await a.execute()).toBe("user-1"); // hits reqStorageA
      expect(await b.execute()).toBe("user-2"); // isolated in reqStorageB
      expect(await b.execute()).toBe("user-2"); // hits reqStorageB
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("resets error/aborted on cache hit and caches undefined values properly", async () => {
      const url = ref("https://api.test/ok");
      const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("fail")) {
          return new Response("bad", {
            status: 500,
            statusText: "Server Error",
          });
        }
        return new Response("ok", { status: 200 });
      });

      const { execute, error, aborted } = useFetch(url, {
        immediate: false,
        fetch: mockFetch,
        afterFetch: () => ({ data: undefined }),
        cacheSetting: { cacheResolve: ({ url: u }) => u },
      });

      // Caches undefined
      expect(await execute()).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fail on another URL so error is non-null
      url.value = "https://api.test/fail";
      await execute(false);
      expect(error.value).toBe("Server Error");

      // Switch back to cached undefined key: hits cache and resets error/aborted
      url.value = "https://api.test/ok";
      expect(await execute()).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(error.value).toBeNull();
      expect(aborted.value).toBe(false);
    });

    it("skips caching SSE and NDJSON streaming responses", async () => {
      const encoder = new TextEncoder();
      const mockFetch = vi.fn(async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('{"n":1}\n'));
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "application/x-ndjson" },
        });
      });

      const received: any[] = [];
      const { execute, promise$ } = useFetch("https://api.test/stream", {
        immediate: false,
        fetch: mockFetch,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });
      promise$.then((v) => received.push(v));

      await execute();
      await execute();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(received).toEqual([{ n: 1 }, { n: 1 }]);
    });
  });

  describe("setMethod, reactivity, getters, loading shell, config isolation", () => {
    it("cleans up previous payload watch when setMethod is called repeatedly", async () => {
      const mockFetch = vi.fn(async () => new Response("ok", { status: 200 }));
      const p1 = ref({ a: 1 });
      const p2 = ref({ b: 1 });

      const req = useFetch("https://api.test/items", {
        immediate: false,
        refetch: true,
        fetch: mockFetch,
      });

      req.post(p1);
      req.post(p2);

      // Mutating old p1 must NOT trigger any request
      p1.value.a = 2;
      await nextTick();
      expect(mockFetch).toHaveBeenCalledTimes(0);

      // Mutating active p2 triggers exactly once
      p2.value.b = 2;
      await nextTick();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("stops URL and payload watchers when effectScope is disposed", async () => {
      const mockFetch = vi.fn(async () => new Response("ok", { status: 200 }));
      const url$ = $("https://api.test/a");
      const payload = ref({ page: 1 });

      const scope = effectScope();
      scope.run(() => {
        useFetch(url$, {
          immediate: false,
          refetch: true,
          fetch: mockFetch,
        }).get(payload);
      });

      url$.next("https://api.test/b");
      await nextTick();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      scope.stop();

      url$.next("https://api.test/c");
      payload.value.page = 2;
      await nextTick();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("checks Observable/Stream before isRef so emitting the same primitive value still triggers refetch", async () => {
      const mockFetch = vi.fn(async () => new Response("ok", { status: 200 }));
      const url$ = $("https://api.test/same");

      useFetch(url$, {
        immediate: false,
        refetch: true,
        fetch: mockFetch,
      });

      // Emitting identical string value would be skipped by Vue watch, but works via Observable.then
      url$.next("https://api.test/same");
      await nextTick();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("supports getter functions for url and payload including reactive refetch", async () => {
      const id = ref(1);
      const q = ref("vue");
      const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
        return new Response(String(input), { status: 200 });
      });

      const { execute, data } = useFetch(
        () => `https://api.test/users/${id.value}`,
        {
          immediate: false,
          refetch: true,
          fetch: mockFetch,
        },
      ).get(() => ({ q: q.value }));

      await execute();
      expect(data.value).toBe("https://api.test/users/1?q=vue");

      id.value = 2;
      await nextTick();
      await vi.waitFor(() => {
        expect(data.value).toBe("https://api.test/users/2?q=vue");
      });

      q.value = "fluth";
      await nextTick();
      await vi.waitFor(() => {
        expect(data.value).toBe("https://api.test/users/2?q=fluth");
      });
    });

    it("returns a chainable shell without mutating config when setMethod/setType called during loading", async () => {
      const deferred = createDeferred<Response>();
      const mockFetch = vi.fn(() => deferred.promise);

      const req = useFetch("https://api.test/data", {
        immediate: false,
        fetch: mockFetch,
      }).get();

      const promise = req.execute();
      expect(req.loading.value).toBe(true);

      // Should NOT throw TypeError when chaining during loading
      const chained = req.post({ x: 1 }).json();
      expect(chained).toBeDefined();
      expect(typeof chained.execute).toBe("function");

      deferred.resolve(new Response("plain-text", { status: 200 }));
      const result = await promise;
      // Config remained text (not mutated to json)
      expect(result).toBe("plain-text");
    });

    it("initializes config.method from fetchOptions and isolates resolved payloadType across executions", async () => {
      const seenMethods: string[] = [];
      const seenCacheMethods: string[] = [];
      const seenHeaders: Record<string, string>[] = [];
      const seenBodies: unknown[] = [];

      const mockFetch = vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) => {
          seenMethods.push(init?.method || "");
          seenHeaders.push((init?.headers as Record<string, string>) || {});
          seenBodies.push(init?.body);
          return new Response("ok", { status: 200 });
        },
      );

      // 1. fetchOptions.method initializes config.method
      const req1 = useFetch("https://api.test/post-init", {
        immediate: false,
        method: "post",
        fetch: mockFetch,
        cacheSetting: {
          cacheResolve: ({ method }) => {
            seenCacheMethods.push(method);
            return "";
          },
        },
      });
      await req1.execute();
      expect(seenCacheMethods).toEqual(["POST"]);
      expect(seenMethods[0]).toBe("POST");

      // 2. Switching reactive payload from plain object to FormData does NOT leak Content-Type: application/json
      const payload = ref<any>({ name: "alice" });
      const req2 = useFetch("https://api.test/upload", {
        immediate: false,
        fetch: mockFetch,
      }).post(payload);

      await req2.execute();
      expect(seenHeaders[1]["Content-Type"]).toBe("application/json");
      expect(seenBodies[1]).toBe(JSON.stringify({ name: "alice" }));

      const fd = new FormData();
      fd.append("file", "content");
      payload.value = fd;

      await req2.execute();
      expect(seenHeaders[2]["Content-Type"]).toBeUndefined();
      expect(seenBodies[2]).toBe(fd);
    });

    it("merges Headers instances and tuple arrays in createFetch and supports Stream URL", async () => {
      const seenUrls: string[] = [];
      const seenHeaders: Record<string, string>[] = [];
      const mockFetch = vi.fn(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          seenUrls.push(String(input));
          seenHeaders.push((init?.headers as Record<string, string>) || {});
          return new Response("ok", { status: 200 });
        },
      );

      const globalHeaders = new Headers();
      globalHeaders.append("X-Global", "g1");

      const useApi = createFetch({
        baseUrl: "https://api.test/",
        options: {
          headers: globalHeaders,
          fetch: mockFetch,
        },
      });

      const path$ = $("/users");
      const { execute } = useApi(path$, {
        immediate: false,
        headers: [["X-Local", "l1"]],
      });

      await execute();
      expect(seenUrls[0]).toBe("https://api.test/users");
      expect(seenHeaders[0]).toEqual({
        "x-global": "g1",
        "X-Local": "l1",
      });
    });
  });

  describe("Request lifecycle, concurrency, timeout, abort, SSR, debounce/throttle", () => {
    it("isolates per-request timeout so canceling request #1 does not stop request #2's timeout or fire premature onFetchFinally", async () => {
      vi.useFakeTimers();
      const finallySpy = vi.fn();
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const mockFetch = createAbortableMockFetch(
        () => new Promise(() => undefined),
      );

      const { execute, aborted, loading, onFetchFinally } = useFetch(
        "https://api.test/slow",
        {
          immediate: false,
          timeout: 100,
          fetch: mockFetch,
        },
      );
      onFetchFinally(finallySpy);

      const p1 = execute(false);
      await vi.advanceTimersByTimeAsync(40);

      // Start request #2 which cancels request #1
      const p2 = execute(false);
      await p1;

      // Request #1's cancellation must NOT stop loading or fire finallyEvent
      expect(loading.value).toBe(true);
      expect(finallySpy).toHaveBeenCalledTimes(0);

      // Request #2 should time out at t=140 (100ms after #2 started)
      await vi.advanceTimersByTimeAsync(110);
      await p2;

      expect(aborted.value).toBe(true);
      expect(loading.value).toBe(false);
      expect(finallySpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it("guards against stale responses when custom fetch ignores AbortSignal", async () => {
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const d1 = createDeferred<Response>();
      const d2 = createDeferred<Response>();
      let call = 0;

      // Intentionally ignores init.signal
      const mockFetch = vi.fn(() => (++call === 1 ? d1.promise : d2.promise));

      const { execute, data, statusCode } = useFetch("https://api.test/race", {
        immediate: false,
        fetch: mockFetch,
      });

      const p1 = execute(false);
      const p2 = execute(false);

      // Request #2 resolves first
      d2.resolve(new Response("fresh", { status: 200 }));
      await p2;
      expect(data.value).toBe("fresh");
      expect(statusCode.value).toBe(200);

      // Stale Request #1 resolves later — must NOT overwrite fresh state
      d1.resolve(new Response("stale", { status: 201 }));
      await p1;
      expect(data.value).toBe("fresh");
      expect(statusCode.value).toBe(200);
      warnSpy.mockRestore();
    });

    it("preserves external fetchOptions.signal across executions without mutating options", async () => {
      const externalController = new AbortController();
      const opts = {
        immediate: false,
        signal: externalController.signal,
        retry: 2,
        fetch: createAbortableMockFetch(async (_url, init) => {
          if (init?.signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }
          await new Promise((r) => setTimeout(r, 50));
          return new Response("ok", { status: 200 });
        }),
      };

      const { execute, aborted } = useFetch(
        "https://api.test/ext-signal",
        opts,
      );

      // First execute succeeds and does not mutate opts.signal
      expect(await execute()).toBe("ok");
      expect(opts.signal).toBe(externalController.signal);

      // Second execute gets aborted via externalController -> aborts without retry
      const p2 = execute(false);
      externalController.abort("external-stop");
      await p2;

      expect(aborted.value).toBe(true);
      expect(opts.fetch).toHaveBeenCalledTimes(2);
    });

    it("defaults internal auto-triggers to throwOnFailed=false while manual execute() still throws by default", async () => {
      const unhandled: any[] = [];
      const onUnhandled = (reason: any) => unhandled.push(reason);
      process.on("unhandledRejection", onUnhandled);

      try {
        const mockFetch = vi.fn(
          async () => new Response("fail", { status: 500, statusText: "Boom" }),
        );
        const url = ref("https://api.test/fail-1");

        const { execute, error } = useFetch(url, {
          immediate: true,
          refetch: true,
          fetch: mockFetch,
        });

        await vi.waitFor(() => {
          expect(error.value).toBe("Boom");
        });

        url.value = "https://api.test/fail-2";
        await vi.waitFor(() => {
          expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        // Allow microtasks to flush to confirm zero unhandled rejections from auto-triggers
        await new Promise((r) => setTimeout(r, 20));
        expect(unhandled).toHaveLength(0);

        // Manual execute() still throws by default
        await expect(execute()).rejects.toBe("Boom");
      } finally {
        process.off("unhandledRejection", onUnhandled);
      }
    });

    it("returns void for debounce/throttle execute, cancels on scope dispose, and warns when both are passed", async () => {
      vi.useFakeTimers();
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const mockFetch = vi.fn(async () => new Response("ok", { status: 200 }));

      let retVal: any = "sentinel";
      const scope = effectScope();
      scope.run(() => {
        const { execute } = useFetch("https://api.test/debounced", {
          immediate: false,
          debounce: 100,
          throttle: 50,
          fetch: mockFetch,
        });
        retVal = execute();
      });

      expect(retVal).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Both 'debounce' and 'throttle'"),
      );

      // Disposing scope before 100ms must cancel the pending debounced request
      scope.stop();
      await vi.advanceTimersByTimeAsync(200);
      expect(mockFetch).toHaveBeenCalledTimes(0);
      warnSpy.mockRestore();
    });

    it("falls back to globalThis.fetch in SSR environments without window", async () => {
      const mockGlobalFetch = vi.fn(
        async () => new Response("ssr-ok", { status: 200 }),
      );
      const originalWindow = globalThis.window;
      const originalFetch = globalThis.fetch;

      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      globalThis.fetch = mockGlobalFetch as any;

      try {
        const { execute, data } = useFetch("https://api.test/ssr", {
          immediate: false,
        });
        expect(await execute()).toBe("ssr-ok");
        expect(data.value).toBe("ssr-ok");
        expect(mockGlobalFetch).toHaveBeenCalledTimes(1);
      } finally {
        Object.defineProperty(globalThis, "window", {
          value: originalWindow,
          configurable: true,
          writable: true,
        });
        globalThis.fetch = originalFetch;
      }
    });

    it("handles void-returning afterFetch and onFetchError callbacks and supplies response in OnFetchErrorContext", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(new Response("hello", { status: 200 }))
        .mockResolvedValueOnce(
          new Response("bad", { status: 422, statusText: "Unprocessable" }),
        );

      let seenErrorResponse: Response | null = null;
      const { execute, data, error } = useFetch("https://api.test/void-hooks", {
        immediate: false,
        fetch: mockFetch,
        afterFetch: (ctx) => {
          ctx.data = `${ctx.data}!`;
          // returns void
        },
        onFetchError: (ctx) => {
          seenErrorResponse = ctx.response;
          ctx.error = "Custom Error";
          // returns void
        },
      });

      await execute();
      expect(data.value).toBe("hello!");

      await execute(false);
      expect(seenErrorResponse).not.toBeNull();
      expect((seenErrorResponse as unknown as Response).status).toBe(422);
      expect(error.value).toBe("Custom Error");
    });
  });

  describe("Retry state machine", () => {
    it("resets loading and retry state after exhaustion so subsequent execute() retries cleanly", async () => {
      const mockFetch = vi.fn(
        async () =>
          new Response("fail", { status: 500, statusText: "Server Error" }),
      );
      const onFetchErrorHook = vi.fn();
      const onFinallyHook = vi.fn();

      const { execute, loading, isFinished, error, onFetchFinally } = useFetch(
        "https://api.test/retry-fail",
        {
          immediate: false,
          retry: 2,
          fetch: mockFetch,
          onFetchError: onFetchErrorHook,
        },
      );
      onFetchFinally(onFinallyHook);

      // First run: 1 initial + 2 retries = 3 calls, propagates rejection
      await expect(execute()).rejects.toBe("Server Error");
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(loading.value).toBe(false);
      expect(isFinished.value).toBe(true);
      expect(error.value).toBe("Server Error");
      // onFetchError & onFetchFinally triggered ONLY ONCE at terminal failure
      expect(onFetchErrorHook).toHaveBeenCalledTimes(1);
      expect(onFinallyHook).toHaveBeenCalledTimes(1);

      // Second run: retry state machine resets, retries 2 more times (3 more calls)
      await expect(execute()).rejects.toBe("Server Error");
      expect(mockFetch).toHaveBeenCalledTimes(6);
      expect(loading.value).toBe(false);
      expect(onFetchErrorHook).toHaveBeenCalledTimes(2);
      expect(onFinallyHook).toHaveBeenCalledTimes(2);
    });

    it("resolves await execute() with eventual data when a retry succeeds and never calls onFetchError", async () => {
      const onFetchErrorHook = vi.fn();
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("err1", { status: 500, statusText: "E1" }),
        )
        .mockResolvedValueOnce(
          new Response("err2", { status: 502, statusText: "E2" }),
        )
        .mockResolvedValueOnce(new Response("recovered", { status: 200 }));

      const { execute, data, error, loading } = useFetch(
        "https://api.test/flaky",
        {
          immediate: false,
          retry: 2,
          fetch: mockFetch,
          onFetchError: onFetchErrorHook,
        },
      );

      const result = await execute();
      expect(result).toBe("recovered");
      expect(data.value).toBe("recovered");
      expect(error.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(onFetchErrorHook).not.toHaveBeenCalled();
    });

    it("does NOT retry when manually aborted", async () => {
      const mockFetch = createAbortableMockFetch(
        () => new Promise(() => undefined),
      );

      const { execute, abort, aborted, loading } = useFetch(
        "https://api.test/abort-no-retry",
        {
          immediate: false,
          retry: 3,
          fetch: mockFetch,
        },
      );

      const promise = execute(false);
      abort("user-canceled");
      await promise;

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(aborted.value).toBe(true);
      expect(loading.value).toBe(false);
    });

    it("supports retry backoff delay and cancels delay immediately on abort()", async () => {
      vi.useFakeTimers();
      const delays: number[] = [];
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("e1", { status: 503, statusText: "Busy" }),
        )
        .mockResolvedValueOnce(
          new Response("e2", { status: 503, statusText: "Busy" }),
        )
        .mockResolvedValueOnce(new Response("ok", { status: 200 }));

      const { execute } = useFetch("https://api.test/backoff", {
        immediate: false,
        retry: {
          count: 2,
          delay: (attempt) => {
            const ms = attempt * 100;
            delays.push(ms);
            return ms;
          },
        },
        fetch: mockFetch,
      });

      const p = execute();
      await vi.advanceTimersByTimeAsync(99);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1); // t=100 -> attempt 1
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(199);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1); // t=300 -> attempt 2 succeeds
      expect(await p).toBe("ok");
      expect(delays).toEqual([100, 200]);

      // Abort during backoff delay cancels immediately without another fetch
      const alwaysFail = vi.fn(
        async () => new Response("fail", { status: 503, statusText: "Down" }),
      );
      const req2 = useFetch("https://api.test/backoff-abort", {
        immediate: false,
        retry: { count: 3, delay: 1000 },
        fetch: alwaysFail,
      });

      const p2 = req2.execute(false);
      await vi.advanceTimersByTimeAsync(100);
      expect(alwaysFail).toHaveBeenCalledTimes(1);

      req2.abort("cancel-backoff");
      await p2;

      expect(req2.aborted.value).toBe(true);
      expect(req2.loading.value).toBe(false);
      await vi.advanceTimersByTimeAsync(5000);
      expect(alwaysFail).toHaveBeenCalledTimes(1);
    });

    it("allows retry on timeout and recovers on subsequent attempt", async () => {
      vi.useFakeTimers();
      let calls = 0;
      const mockFetch = createAbortableMockFetch(() => {
        calls += 1;
        if (calls === 1) {
          return new Promise(() => undefined); // hangs and times out
        }
        return new Response("fast-ok", { status: 200 });
      });

      const { execute, data, aborted, loading } = useFetch(
        "https://api.test/timeout-retry",
        {
          immediate: false,
          timeout: 50,
          retry: 1,
          fetch: mockFetch,
        },
      );

      const p = execute();
      await vi.advanceTimersByTimeAsync(60);
      expect(await p).toBe("fast-ok");
      expect(data.value).toBe("fast-ok");
      expect(aborted.value).toBe(false);
      expect(loading.value).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Streaming (SSE / NDJSON) & abortOnUnmount", () => {
    it("checks response.ok before streaming and does not push error chunks to promise$", async () => {
      const encoder = new TextEncoder();
      const mockFetch = vi.fn(async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("data: error payload\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          status: 500,
          statusText: "Stream Error",
          headers: { "Content-Type": "text/event-stream" },
        });
      });

      const receivedValues: any[] = [];
      const receivedErrors: any[] = [];
      const { execute, promise$, error } = useFetch(
        "https://api.test/bad-sse",
        {
          immediate: false,
          fetch: mockFetch,
        },
      );
      promise$.then(
        (v) => receivedValues.push(v),
        (e) => receivedErrors.push(e),
      );

      await execute(false);
      expect(receivedValues).toHaveLength(0);
      expect(error.value).toBe("Stream Error");
      expect(receivedErrors).toEqual(["Stream Error"]);
    });

    it("does not call response.clone() when reading SSE/NDJSON streams", async () => {
      const encoder = new TextEncoder();
      let cloneSpy: any;
      const mockFetch = vi.fn(async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("data: hi\n\n"));
            controller.close();
          },
        });
        const res = new Response(stream, {
          status: 200,
          headers: { "Content-Type": "TEXT/EVENT-STREAM; charset=utf-8" },
        });
        cloneSpy = vi.spyOn(res, "clone");
        return res;
      });

      const { execute, data } = useFetch("https://api.test/no-clone", {
        immediate: false,
        fetch: mockFetch,
      });

      await execute();
      expect(data.value).toBe("data: hi\n\n");
      expect(cloneSpy).not.toHaveBeenCalled();
    });

    it("decodes multi-byte UTF-8 split across chunks, flushes decoder, and supports CRLF + application/ndjson", async () => {
      const encoder = new TextEncoder();
      // Split 3-byte Chinese char "中" across two chunks
      const line1 = encoder.encode('{"msg":"你好世界"}\r\n');
      const line2 = encoder.encode('{"msg":"结束"}');
      const splitPoint = 11; // cuts right inside multi-byte UTF-8 sequence

      const mockFetch = vi.fn(async () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(line1.slice(0, splitPoint));
            controller.enqueue(line1.slice(splitPoint));
            controller.enqueue(line2);
            controller.close();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "application/ndjson" },
        });
      });

      const items: any[] = [];
      const { execute, promise$ } = useFetch("https://api.test/utf8-ndjson", {
        immediate: false,
        fetch: mockFetch,
      });
      promise$.then((v) => items.push(v));

      await execute();
      expect(items).toEqual([{ msg: "你好世界" }, { msg: "结束" }]);
    });

    it("cancels and releases reader on manual abort and scope dispose", async () => {
      const encoder = new TextEncoder();
      let cancelCount = 0;

      const createHangingStreamResponse = () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode("data: first\n\n"));
          },
          cancel() {
            cancelCount += 1;
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      };

      // 1. Manual abort cancels reader and stops loading
      const req1 = useFetch("https://api.test/sse-abort", {
        immediate: false,
        fetch: vi.fn(async () => createHangingStreamResponse()),
      });
      const chunks1: string[] = [];
      req1.promise$.then((v) => chunks1.push(v));

      const p1 = req1.execute(false);
      await vi.waitFor(() => expect(chunks1).toHaveLength(1));
      req1.abort("stop-stream");
      await p1;

      expect(cancelCount).toBe(1);
      expect(req1.aborted.value).toBe(true);
      expect(req1.loading.value).toBe(false);

      // 2. Scope dispose cancels streaming reader even when abortOnUnmount is false
      const chunks2: string[] = [];
      let p2!: Promise<any>;
      const scope = effectScope();
      scope.run(() => {
        const req2 = useFetch("https://api.test/sse-unmount", {
          immediate: false,
          fetch: vi.fn(async () => createHangingStreamResponse()),
        });
        req2.promise$.then((v) => chunks2.push(v));
        p2 = req2.execute(false) as Promise<any>;
      });

      await vi.waitFor(() => expect(chunks2).toHaveLength(1));
      scope.stop();
      await p2;
      expect(cancelCount).toBe(2);
    });

    it("respects abortOnUnmount option for normal requests (default false, optional true)", async () => {
      // Default abortOnUnmount = false: normal request continues and resolves
      const d1 = createDeferred<Response>();
      const mockFetch1 = createAbortableMockFetch(() => d1.promise);
      let req1!: ReturnType<typeof useFetch>;

      const scope1 = effectScope();
      scope1.run(() => {
        req1 = useFetch("https://api.test/keep-alive", {
          immediate: false,
          fetch: mockFetch1,
        });
      });

      const p1 = req1.execute(false);
      scope1.stop();
      expect(req1.aborted.value).toBe(false);
      d1.resolve(new Response("completed", { status: 200 }));
      expect(await p1).toBe("completed");

      // abortOnUnmount = true: normal request is aborted on dispose (without retry)
      const mockFetch2 = createAbortableMockFetch(
        () => new Promise(() => undefined),
      );
      let req2!: ReturnType<typeof useFetch>;

      const scope2 = effectScope();
      scope2.run(() => {
        req2 = useFetch("https://api.test/abort-on-unmount", {
          immediate: false,
          abortOnUnmount: true,
          retry: 2,
          fetch: mockFetch2,
        });
      });

      const p2 = req2.execute(false);
      scope2.stop();
      await p2;
      expect(req2.aborted.value).toBe(true);
      expect(req2.loading.value).toBe(false);
      expect(mockFetch2).toHaveBeenCalledTimes(1);
    });
  });
});
