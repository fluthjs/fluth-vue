import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, reactive, computed } from "vue";
import { to$ } from "../index";

describe("to$ function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should convert ref to stream with immutable behavior", async () => {
    const refValue = ref("initial");
    const stream$ = to$(refValue);

    // Initial value should be correct
    expect(stream$.value).toBe("initial");

    // Listen to stream changes
    const values: string[] = [];
    stream$.then((value) => {
      values.push(value);
    });

    // Modify ref value
    refValue.value = "updated";

    // Wait for async update
    await vi.runAllTimersAsync();

    // Stream should receive new value
    expect(values).toContain("updated");
    expect(stream$.value).toBe("updated");
  });

  it("should convert reactive object to stream with immutable behavior", async () => {
    const reactiveObj = reactive({ count: 0, name: "test" });
    const stream$ = to$(reactiveObj);

    // Initial value should be correct
    expect(stream$.value).toEqual({ count: 0, name: "test" });

    // Listen to stream changes
    const values: any[] = [];
    stream$.then((value) => {
      values.push(value);
    });

    // Modify reactive object
    reactiveObj.count = 1;

    // Wait for async update
    await vi.runAllTimersAsync();

    // Stream should receive new value
    expect(values.length).toBeGreaterThan(0);
    expect(stream$.value.count).toBe(1);
  });

  it("should convert computed ref to stream with immutable behavior", async () => {
    const baseRef = ref(10);
    const computedValue = computed(() => baseRef.value * 2);
    const stream$ = to$(computedValue);

    // Initial value should be correct
    expect(stream$.value).toBe(20);

    // Listen to stream changes
    const values: number[] = [];
    stream$.then((value) => {
      values.push(value);
    });

    // Modify base ref value
    baseRef.value = 15;

    // Wait for async update
    await vi.runAllTimersAsync();

    // Stream should receive new computed value
    expect(values).toContain(30);
    expect(stream$.value).toBe(30);
  });

  it("should maintain immutability - original ref should not be affected by stream operations", async () => {
    const refValue = ref({ data: "original" });
    const stream$ = to$(refValue);

    // Get reference to initial value
    const originalValue = refValue.value;

    // Modify ref value
    refValue.value = { data: "modified" };

    // Wait for async update
    await vi.runAllTimersAsync();

    // Original value should remain unchanged (immutable)
    expect(originalValue.data).toBe("original");
    expect(refValue.value.data).toBe("modified");
    expect(stream$.value.data).toBe("modified");
  });

  it("should handle deep reactive changes", async () => {
    const reactiveObj = reactive({
      nested: {
        value: "initial",
      },
    });
    const stream$ = to$(reactiveObj);

    // Listen to stream changes
    const values: any[] = [];
    stream$.then((value) => {
      values.push(value);
    });

    // Modify nested property
    reactiveObj.nested.value = "updated";

    // Wait for async update
    await vi.runAllTimersAsync();

    // Stream should detect deep changes
    expect(values.length).toBeGreaterThan(0);
    expect(stream$.value.nested.value).toBe("updated");
  });

  it("should clean up watch when stream is completed", async () => {
    const refValue = ref("initial");
    const stream$ = to$(refValue);

    // Listen to stream changes
    const values: string[] = [];
    stream$.then((value) => {
      values.push(value);
    });

    // Modify ref value before completing
    refValue.value = "before-complete";
    await vi.runAllTimersAsync();

    // Complete the stream
    stream$.complete();

    // Clear previous values to test cleanup
    values.length = 0;

    // Modify ref value after completing stream
    refValue.value = "after-complete";
    await vi.runAllTimersAsync();

    // Stream should not receive new values after completion
    // because watch should be cleaned up
    expect(values).toHaveLength(0);
    expect(stream$.value).toBe("before-complete"); // Should remain at last value before completion
  });
});
