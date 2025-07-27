import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue-demi";
import nodeFetch from "node-fetch";
import { useFetch, clearFetchCache } from "../index";
import "./mockServer";
import { isBelowNode18 } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;
window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with cache", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy.mockClear();
    fetchSpy = vi.spyOn(window, "fetch") as any;
    clearFetchCache(); // 清除之前测试的缓存
  });

  describe("Basic caching", () => {
    it("should cache correctly", async () => {
      vi.useFakeTimers();
      const { execute, cancelRefresh, clearCache } = useFetch(
        "https://example.com",
        {
          immediate: false,
          refresh: 100,
          cacheSetting: { cacheResolve: ({ url }) => url },
        },
      );
      await execute();
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetchSpy).toBeCalledTimes(1);
      clearCache();
      cancelRefresh();
    });

    it("should return cached data without network request", async () => {
      const { execute, data, clearCache } = useFetch(
        "https://example.com?json",
        {
          immediate: false,
          cacheSetting: { cacheResolve: ({ url }) => url },
        },
      ).json();

      // First request
      const result1 = await execute();
      expect(fetchSpy).toBeCalledTimes(1);
      expect(data.value).toEqual(result1);

      // Second request should hit cache
      const result2 = await execute();
      expect(fetchSpy).toBeCalledTimes(1); // No additional request
      expect(result2).toEqual(result1);
      expect(data.value).toEqual(result1);

      clearCache();
    });

    it("should handle cache with different HTTP methods", async () => {
      const cacheResolve = ({ url, method, payload }: any) =>
        `${method}:${url}:${JSON.stringify(payload)}`;

      const { execute: executeGet, clearCache: clearGet } = useFetch(
        "https://example.com",
        {
          immediate: false,
          cacheSetting: { cacheResolve },
        },
      ).get({ page: 1 });

      const { execute: executePost, clearCache: clearPost } = useFetch(
        "https://example.com",
        {
          immediate: false,
          cacheSetting: { cacheResolve },
        },
      ).post({ page: 1 });

      await executeGet();
      await executePost();
      expect(fetchSpy).toBeCalledTimes(2); // Different methods, different cache keys

      await executeGet();
      await executePost();
      expect(fetchSpy).toBeCalledTimes(2); // Both should hit cache

      clearGet();
      clearPost();
    });
  });

  describe("Cache expiration", () => {
    it("should cacheExpiration correctly", async () => {
      vi.useFakeTimers();
      const { execute, cancelRefresh, clearCache } = useFetch(
        "https://example.com/test",
        {
          immediate: false,
          refresh: 100,
          cacheSetting: { expiration: 600, cacheResolve: ({ url }) => url },
        },
      );
      await execute();
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetchSpy).toBeCalledTimes(2);
      clearCache();
      cancelRefresh();
    });

    it("should respect cache expiration time", async () => {
      vi.useFakeTimers();
      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: {
          expiration: 1000, // 1 second
          cacheResolve: ({ url }) => url,
        },
      });

      // First request
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Second request within expiration - should hit cache
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Advance time beyond expiration
      await vi.advanceTimersByTimeAsync(1500);

      // Third request after expiration - should make new request
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);

      clearCache();
      vi.useRealTimers();
    });
  });

  describe("Cache management", () => {
    it("should clearCache correctly", async () => {
      vi.useFakeTimers();
      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
      clearCache();
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);
      clearCache();
    });

    it("should clearAllCache correctly", async () => {
      vi.useFakeTimers();
      const { execute: execute1 } = useFetch("https://example.com?text=one", {
        immediate: false,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });
      const { execute: execute2 } = useFetch("https://example.com?text=two", {
        immediate: false,
        cacheSetting: { cacheResolve: ({ url }) => url },
      });
      await execute1();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(2);
      await execute1();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(2);
      clearFetchCache();
      await execute1();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(4);
      clearFetchCache();
    });
  });

  describe("Cache resolvers", () => {
    it("should cacheResolver correctly", async () => {
      vi.useFakeTimers();
      const cacheResolve = ({ url, payload, type }: any) =>
        url + type + payload.a;
      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: { cacheResolve },
      }).post({
        a: 1,
        b: 2,
      });
      const { execute: execute2 } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: { cacheResolve },
      }).post({ a: 1, c: 2 });
      await execute();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(1);
      clearCache();
    });

    it("should handle complex cache key generation", async () => {
      const cacheResolve = ({ url, payload, method, type }: any) => {
        return `${method}:${url}:${type}:${JSON.stringify(payload)}`;
      };

      const { execute: execute1, clearCache: clear1 } = useFetch(
        "https://example.com",
        {
          immediate: false,
          cacheSetting: { cacheResolve },
        },
      )
        .post({ id: 1, name: "test" })
        .json();

      const { execute: execute2, clearCache: clear2 } = useFetch(
        "https://example.com",
        {
          immediate: false,
          cacheSetting: { cacheResolve },
        },
      )
        .post({ id: 2, name: "test" })
        .json(); // Different payload

      await execute1();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(2); // Different payloads, different cache keys

      // Repeat requests should hit cache
      await execute1();
      await execute2();
      expect(fetchSpy).toBeCalledTimes(2);

      clear1();
      clear2();
    });
  });

  describe("Promise$ and state behavior", () => {
    it("should push cached data to promise$ stream", async () => {
      const { execute, promise$, clearCache } = useFetch(
        "https://example.com?json",
        {
          immediate: false,
          cacheSetting: { cacheResolve: ({ url }) => url },
        },
      ).json();

      const streamData: any[] = [];
      promise$.then((data) => {
        streamData.push(data);
      });

      // First request
      await execute();
      expect(streamData).toHaveLength(1);

      // Second request (cache hit) should also push to stream
      await execute();
      expect(streamData).toHaveLength(2);
      expect(streamData[0]).toEqual(streamData[1]);

      clearCache();
    });

    it("should not affect loading state when cache is hit", async () => {
      const { execute, loading, clearCache } = useFetch(
        "https://example.com?json",
        {
          immediate: false,
          cacheSetting: { cacheResolve: ({ url }) => url },
        },
      );

      // First request
      expect(loading.value).toBe(false);
      const promise1 = execute();
      expect(loading.value).toBe(true);
      await promise1;
      expect(loading.value).toBe(false);

      // Cache hit should not trigger loading state
      expect(loading.value).toBe(false);
      await execute();
      expect(loading.value).toBe(false);

      clearCache();
    });

    it("should handle error responses with cache", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(new Response("success", { status: 200 }))
        .mockRejectedValue(new Error("Network error"));

      const { execute, data, error, clearCache } = useFetch(
        "https://example.com",
        {
          immediate: false,
          fetch: mockFetch,
          cacheSetting: { cacheResolve: ({ url }) => url },
        },
      );

      // First successful request gets cached
      await execute();
      expect(data.value).toBe("success");
      expect(error.value).toBeNull();
      expect(mockFetch).toBeCalledTimes(1);

      // Second request hits cache, not the error
      await execute();
      expect(data.value).toBe("success");
      expect(error.value).toBeNull();
      expect(mockFetch).toBeCalledTimes(1);

      clearCache();
    });
  });

  describe("Cache with reactive data", () => {
    it("should work with reactive payloads", async () => {
      const page = ref(1);
      const getPayload = computed(() => ({ page: page.value }));

      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: {
          cacheResolve: ({ url, payload }) =>
            `${url}:${JSON.stringify((payload as typeof getPayload).value.page)}`,
        },
      }).get(getPayload);

      // Initial request
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Same parameters - cache hit
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Change page - different cache key
      page.value = 2;
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);

      clearCache();
    });
  });

  describe("Cache edge cases", () => {
    it("should handle undefined cache resolver", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: {
          /* no cacheResolve function */
        },
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Without cache resolver, no caching should occur
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);
    });

    it("should handle empty cache resolver result", async () => {
      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        cacheSetting: { cacheResolve: () => "" }, // Empty string
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Empty cache key should not enable caching
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);

      clearCache();
    });

    it("should handle cache with condition", async () => {
      const condition = ref(true);

      const { execute, clearCache } = useFetch("https://example.com", {
        immediate: false,
        condition,
        cacheSetting: {
          cacheResolve: ({ url }) => url,
        },
      });

      // First request with condition enabled
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Second request should hit cache
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // Disable condition - should not execute
      condition.value = false;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      clearCache();
    });
  });
});
