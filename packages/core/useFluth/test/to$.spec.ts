import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ref,
  reactive,
  computed,
  shallowRef,
  isReactive,
  effectScope,
} from "vue";
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

  it("should deep clone circular references, Date, RegExp, Map, Set, and preserve functions/class instances", async () => {
    class CustomBox {
      constructor(public id: number) {}
    }
    const fn = () => "hello";
    const box = new CustomBox(7);
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const pattern = /fluth/gi;
    const map = new Map<string, { n: number }>([["k", { n: 1 }]]);
    const set = new Set([{ tag: "a" }]);

    const obj: any = {
      fn,
      box,
      createdAt,
      pattern,
      map,
      set,
    };
    obj.self = obj;

    const source = ref(obj);
    const stream$ = to$(source);

    expect(isReactive(stream$.value)).toBe(false);
    expect(stream$.value).not.toBe(obj);
    expect(stream$.value.self).toBe(stream$.value);
    expect(stream$.value.fn).toBe(fn);
    expect(stream$.value.box).toBe(box);
    expect(stream$.value.createdAt).toBeInstanceOf(Date);
    expect(stream$.value.createdAt).not.toBe(createdAt);
    expect(stream$.value.createdAt.getTime()).toBe(createdAt.getTime());
    expect(stream$.value.pattern).toBeInstanceOf(RegExp);
    expect(stream$.value.pattern).not.toBe(pattern);
    expect(stream$.value.pattern.source).toBe("fluth");
    expect(stream$.value.pattern.flags).toBe("gi");
    expect(stream$.value.map).toBeInstanceOf(Map);
    expect(stream$.value.map).not.toBe(map);
    expect(stream$.value.map.get("k")).toEqual({ n: 1 });
    expect(stream$.value.map.get("k")).not.toBe(map.get("k"));
    expect(stream$.value.set).toBeInstanceOf(Set);
    expect(stream$.value.set).not.toBe(set);
    expect(Array.from(stream$.value.set)).toEqual([{ tag: "a" }]);
  });

  it("should unwrap reactive proxies deeply via toRaw when cloning", () => {
    const nested = reactive({ a: 1, inner: { b: 2 } });
    const source = ref(nested);
    const stream$ = to$(source);

    expect(isReactive(stream$.value)).toBe(false);
    expect(isReactive(stream$.value.inner)).toBe(false);
    expect(stream$.value).toEqual({ a: 1, inner: { b: 2 } });
  });

  it("should respect shallowRef semantics by default and allow deep override", async () => {
    const shallow = shallowRef({ nested: { count: 0 } });
    const stream$ = to$(shallow);
    const received: any[] = [];
    stream$.then((v) => received.push(v));

    // Mutating nested property should NOT trigger watch for shallowRef
    shallow.value.nested.count = 1;
    await vi.runAllTimersAsync();
    expect(received).toHaveLength(0);

    // Replacing top-level value SHOULD trigger watch
    shallow.value = { nested: { count: 2 } };
    await vi.runAllTimersAsync();
    expect(received).toHaveLength(1);
    expect(stream$.value.nested.count).toBe(2);
  });

  it("should support clone: false and custom clone function", async () => {
    const rawObj = { count: 1 };
    const r = shallowRef(rawObj);
    const noClone$ = to$(r, { clone: false });
    expect(noClone$.value).toBe(rawObj);

    const customClone$ = to$(r, {
      clone: (v) => ({ count: v.count * 10 }),
    });
    expect(customClone$.value).toEqual({ count: 10 });

    r.value = { count: 2 };
    await vi.runAllTimersAsync();
    expect(customClone$.value).toEqual({ count: 20 });
  });

  it("should clean up watch when enclosing EffectScope is disposed", async () => {
    const source = ref("v0");
    const values: string[] = [];
    const scope = effectScope();

    scope.run(() => {
      const s$ = to$(source);
      s$.then((v) => values.push(v));
    });

    source.value = "v1";
    await vi.runAllTimersAsync();
    expect(values).toEqual(["v1"]);

    scope.stop();

    source.value = "v2";
    await vi.runAllTimersAsync();
    expect(values).toEqual(["v1"]);
  });
});
