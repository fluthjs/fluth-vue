import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { $, render$, consoleAll } from "../index";

// Create test component helper
const createTestComponent = (stream$: any) => {
  return defineComponent({
    template: '<div v-render$="streamValue"></div>',
    directives: {
      render$: render$,
    },
    setup() {
      return {
        streamValue: stream$,
      };
    },
  });
};

const consoleSpy = vi.spyOn(console, "log");

describe("render$ directive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    consoleSpy.mockClear();
  });

  it("should correctly render initial value of Stream", () => {
    const stream$ = $("Hello World");
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("Hello World");
  });

  it("should correctly render Observable values", async () => {
    const stream$ = $("initial");
    const observable = stream$.then((value) => `processed: ${value}`);
    const TestComponent = createTestComponent(observable);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    // Observable should have no initial value, expect empty string
    expect(divElement.text()).toBe("");

    // Trigger stream value update, observable should receive processed value
    stream$.next("new value");
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("processed: new value");
  });

  it("should update DOM content when Stream value changes", async () => {
    const stream$ = $("initial value");
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("initial value");

    // Update stream value
    stream$.next("updated value");
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("updated value");
  });

  it("should correctly handle number type values", () => {
    const stream$ = $(42);
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("42");
  });

  it("should correctly handle null and undefined values", async () => {
    const stream$ = $<string | null | undefined>("initial");
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("initial");

    // Test null value
    stream$.next(null);
    await wrapper.vm.$nextTick();
    expect(divElement.text()).toBe("");

    // Test undefined value
    stream$.next(undefined);
    await wrapper.vm.$nextTick();
    expect(divElement.text()).toBe("");
  });

  it("should throw error when input is not Stream or Observable", () => {
    const TestComponent = createTestComponent("not a stream");

    expect(() => {
      mount(TestComponent);
    }).toThrow("$render only accepts Stream or Observable as input");
  });

  it("should properly unsubscribe when component unmounts", async () => {
    const stream$ = $("initial").use(consoleAll());
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("initial");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, "resolve", undefined);

    // Unmount component
    wrapper.unmount();
    stream$.next("after unmount");
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "resolve", "after unmount");
  });

  it("should correctly handle boolean values", async () => {
    const stream$ = $(true);
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("true");

    stream$.next(false);
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("false");
  });

  it("should correctly handle object type values", async () => {
    const stream$ = $({ name: "test", count: 1 });
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    expect(divElement.text()).toBe("[object Object]");

    stream$.next({ name: "updated", count: 2 });
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("[object Object]");
  });

  it("should correctly handle Stream without initial value", async () => {
    const stream$ = $<string>();
    const TestComponent = createTestComponent(stream$);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    // Should be empty string when no initial value
    expect(divElement.text()).toBe("");

    // Should display correctly after setting value
    stream$.next("first value");
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("first value");
  });

  it("should support chained Observable calls", async () => {
    const stream$ = $(1);
    const observable = stream$
      .then((value) => value * 2)
      .then((value) => `Result: ${value}`);

    const TestComponent = createTestComponent(observable);

    const wrapper = mount(TestComponent);
    const divElement = wrapper.find("div");

    // Initial state should be empty
    expect(divElement.text()).toBe("");

    // Trigger computation chain
    stream$.next(5);
    await wrapper.vm.$nextTick();

    expect(divElement.text()).toBe("Result: 10");
  });
});
