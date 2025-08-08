import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, computed } from "vue";
import nodeFetch from "node-fetch";

import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, sleep } from "./utils";
import { $ } from "../../useFluth/index";

let fetchSpy = vi.spyOn(window, "fetch") as any;

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18)("useFetch with condition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
    fetchSpy.mockClear();
  });

  describe("Basic condition types", () => {
    it("should work with boolean literal true", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: true,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should work with boolean literal false", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: false,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);
    });

    it("should work with function returning true", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: () => true,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should work with function returning false", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: () => false,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);
    });
  });

  describe("Ref condition", () => {
    it("should be ref condition work correctly", async () => {
      vi.useFakeTimers();
      const condition = ref(false);
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      condition.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should be reactive to ref changes", async () => {
      const condition = ref(true);
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      condition.value = false;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1); // Should not call again

      condition.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);
    });
  });

  describe("Computed condition", () => {
    it("should be computed condition work correctly", async () => {
      vi.useFakeTimers();
      const trigger = ref(false);
      const condition = computed(() => trigger.value);

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      trigger.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should work with complex computed conditions", async () => {
      const userLoggedIn = ref(false);
      const hasPermission = ref(false);
      const condition = computed(
        () => userLoggedIn.value && hasPermission.value,
      );

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      // Both false - should not fetch
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      // Only one true - should not fetch
      userLoggedIn.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      // Both true - should fetch
      hasPermission.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      // One becomes false - should not fetch
      userLoggedIn.value = false;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });
  });

  describe("Stream condition", () => {
    it("should be Stream condition work correctly", async () => {
      vi.useFakeTimers();
      const condition = $(false);
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      condition.next(true);
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should work with Observable condition", async () => {
      const condition = $(false);
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      condition.next(true);
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      condition.next(false);
      await execute();
      expect(fetchSpy).toBeCalledTimes(1); // Should not call again

      condition.next(true);
      await execute();
      expect(fetchSpy).toBeCalledTimes(2);
    });
  });

  describe("Function condition", () => {
    it("should work with dynamic function conditions", async () => {
      let shouldFetch = false;
      const condition = () => shouldFetch;

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      shouldFetch = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);

      shouldFetch = false;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should work with async-like conditions", async () => {
      const isReady = ref(false);
      const condition = () => {
        // Simulate some logic that depends on external state
        return isReady.value && new Date().getTime() > 0;
      };

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      await execute();
      expect(fetchSpy).toBeCalledTimes(0);

      isReady.value = true;
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });
  });

  describe("Condition with immediate option", () => {
    it("should respect condition when immediate is true", async () => {
      vi.useFakeTimers();
      const condition = ref(false);

      useFetch("https://example.com", {
        immediate: true,
        condition,
      });

      await vi.runAllTimersAsync();
      expect(fetchSpy).toBeCalledTimes(0);

      condition.value = true;
      useFetch("https://example.com", {
        immediate: true,
        condition,
      });

      await vi.runAllTimersAsync();
      expect(fetchSpy).toBeCalledTimes(1);
    });
  });

  describe("Condition with other options", () => {
    it("should work with condition and refetch", async () => {
      const condition = ref(true);
      const url = ref("https://example.com/1");

      useFetch(url, {
        immediate: false,
        refetch: true,
        condition,
      });

      // Change URL when condition is true
      url.value = "https://example.com/2";
      await sleep(50);

      expect(fetchSpy).toBeCalledTimes(1);

      // Change URL when condition is false
      condition.value = false;
      url.value = "https://example.com/3";
      await expect(fetchSpy).toBeCalledTimes(1); // Should not refetch
    });

    it("should work with condition and retry", async () => {
      const condition = ref(true);
      let shouldFail = true;

      const mockFailingFetch = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve(new Response("ok"));
      });

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
        retry: 2,
        fetch: mockFailingFetch,
      });

      try {
        await execute();
      } catch {
        // Expected to fail
      }
      expect(mockFailingFetch).toBeCalledTimes(3); // Initial + 2 retries

      // Should not retry when condition is false
      condition.value = false;
      shouldFail = true;
      mockFailingFetch.mockClear();

      try {
        await execute();
      } catch {
        // Expected to fail if condition was true
      }
      expect(mockFailingFetch).toBeCalledTimes(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined condition (default to true)", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        // condition is undefined, should default to true
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(1);
    });

    it("should handle null condition", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: null as any,
      });
      await execute();
      expect(fetchSpy).toBeCalledTimes(0); // null is falsy
    });

    it("should handle condition that throws error", async () => {
      const condition = () => {
        throw new Error("Condition error");
      };

      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      await expect(execute()).rejects.toThrow("Condition error");
      expect(fetchSpy).toBeCalledTimes(0);
    });

    it("should return null when condition is false", async () => {
      const { execute } = useFetch("https://example.com", {
        immediate: false,
        condition: false,
      });

      const result = await execute();
      expect(result).toBeNull();
      expect(fetchSpy).toBeCalledTimes(0);
    });
  });

  describe("Condition state management", () => {
    it("should not affect loading state when condition is false", async () => {
      const condition = ref(false);
      const { execute, loading, isFinished } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      expect(loading.value).toBe(false);
      expect(isFinished.value).toBe(false);

      await execute();

      expect(loading.value).toBe(false);
      expect(isFinished.value).toBe(false);
      expect(fetchSpy).toBeCalledTimes(0);
    });

    it("should properly manage state when condition changes during request", async () => {
      const condition = ref(true);
      const { execute, loading } = useFetch("https://example.com", {
        immediate: false,
        condition,
      });

      // Start request with condition true
      const promise = execute();
      expect(loading.value).toBe(true);

      // Change condition to false during request (shouldn't affect ongoing request)
      condition.value = false;

      await promise;
      expect(loading.value).toBe(false);
      expect(fetchSpy).toBeCalledTimes(1);
    });
  });
});
