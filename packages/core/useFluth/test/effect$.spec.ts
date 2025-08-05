import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { $, render$, effect$, consoleAll, debugAll } from "../index";

const consoleSpy = vi.spyOn(console, "log");
const consoleErrorSpy = vi.spyOn(console, "error");

describe("render$ function comprehensive tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe("Basic Functionality", () => {
    it("without effect$ wrapper render, stream subscribe will not auto unsubscribe when render function is called again", async () => {
      const stream$ = $("Hello").use(consoleAll());
      const trigger$ = $("trigger");

      const TestComponent = defineComponent({
        setup() {
          const trigger$Compt = trigger$.toCompt();

          return () =>
            h("div", null, [
              h(render$(stream$.thenImmediate((v) => v))),
              h("span", null, "-"),
              h("span", null, trigger$Compt.value),
            ]);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Hello-trigger");
      expect(consoleSpy).toHaveBeenNthCalledWith(1, "resolve", "Hello"); // thenImmediate trigger consoleAll plugin

      stream$.next("World");
      await vi.runAllTimersAsync();
      expect(wrapper.text()).toBe("World-trigger");
      expect(consoleSpy).toHaveBeenNthCalledWith(2, "resolve", "World"); // root node trigger consoleAll plugin
      expect(consoleSpy).toHaveBeenNthCalledWith(3, "resolve", "World"); // thenImmediate trigger consoleAll plugin

      expect(consoleSpy).toHaveBeenCalledTimes(3);

      // trigger render function run three times
      trigger$.next("trigger1");
      await vi.runAllTimersAsync();
      trigger$.next("trigger2");
      await vi.runAllTimersAsync();
      trigger$.next("trigger3");
      await vi.runAllTimersAsync();

      // trigger thenImmediate run three times
      expect(consoleSpy).toHaveBeenNthCalledWith(4, "resolve", "World");
      expect(consoleSpy).toHaveBeenNthCalledWith(5, "resolve", "World");
      expect(consoleSpy).toHaveBeenNthCalledWith(6, "resolve", "World");

      stream$.next("test");
      await vi.runAllTimersAsync();
      expect(consoleSpy).toHaveBeenNthCalledWith(7, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(8, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(9, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(10, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(11, "resolve", "test");

      expect(consoleSpy).toHaveBeenCalledTimes(11);
    });

    it("with effect$ wrapper render, stream subscribe will auto unsubscribe when render function is called again or component unmount", async () => {
      const stream$ = $("Hello").use(consoleAll(), debugAll());
      const trigger$ = $("trigger");

      const TestComponent = defineComponent({
        setup() {
          const trigger$Compt = trigger$.toCompt();

          return effect$(() =>
            h("div", null, [
              h(render$(stream$.thenImmediate((v) => v))),
              h("span", null, "-"),
              h("span", null, trigger$Compt.value),
            ]),
          );
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Hello-trigger");
      expect(consoleSpy).toHaveBeenNthCalledWith(1, "resolve", "Hello"); // thenImmediate trigger consoleAll plugin

      stream$.next("World");
      await vi.runAllTimersAsync();
      expect(wrapper.text()).toBe("World-trigger");
      expect(consoleSpy).toHaveBeenNthCalledWith(2, "resolve", "World"); // root node trigger consoleAll plugin
      expect(consoleSpy).toHaveBeenNthCalledWith(3, "resolve", "World"); // thenImmediate trigger consoleAll plugin

      expect(consoleSpy).toHaveBeenCalledTimes(3);

      trigger$.next("trigger1");
      await vi.runAllTimersAsync();
      trigger$.next("trigger2");
      await vi.runAllTimersAsync();
      trigger$.next("trigger3");
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenNthCalledWith(4, "resolve", "World");
      expect(consoleSpy).toHaveBeenNthCalledWith(5, "resolve", "World");
      expect(consoleSpy).toHaveBeenNthCalledWith(6, "resolve", "World");

      stream$.next("test");
      await vi.runAllTimersAsync();
      expect(consoleSpy).toHaveBeenNthCalledWith(7, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(8, "resolve", "test");
      expect(consoleSpy).toHaveBeenCalledTimes(8);

      wrapper.unmount();

      stream$.next("test1");
      await vi.runAllTimersAsync();
      expect(consoleSpy).toHaveBeenNthCalledWith(9, "resolve", "test1");

      expect(consoleSpy).toHaveBeenCalledTimes(9);
    });

    it("with effect$ wrapper render, toComp will auto unsubscribe when render function is called again or component unmount", async () => {
      const stream$ = $("Hello").use(consoleAll("resolve", "reject", false));
      const trigger$ = $("trigger");

      const TestComponent = defineComponent({
        setup() {
          const trigger$Compt = trigger$.toCompt();

          return effect$(() =>
            h("div", null, [
              h("span", null, stream$.toCompt().value),
              h("span", null, "-"),
              h("span", null, trigger$Compt.value),
            ]),
          );
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Hello-trigger");

      stream$.next("World");
      await vi.runAllTimersAsync();
      expect(wrapper.text()).toBe("World-trigger");

      expect(consoleSpy).toHaveBeenNthCalledWith(1, "resolve", "World");
      expect(consoleSpy).toHaveBeenNthCalledWith(2, "resolve", undefined); // toComp is a subscribe node for stream$, and it will be resolved with undefined

      trigger$.next("trigger1");
      await vi.runAllTimersAsync();
      trigger$.next("trigger2");
      await vi.runAllTimersAsync();
      trigger$.next("trigger3");
      await vi.runAllTimersAsync();

      stream$.next("test");
      await vi.runAllTimersAsync();
      expect(consoleSpy).toHaveBeenNthCalledWith(3, "resolve", "test");
      expect(consoleSpy).toHaveBeenNthCalledWith(4, "resolve", undefined);
      expect(consoleSpy).toHaveBeenCalledTimes(4);

      stream$.next("test1");
      await vi.runAllTimersAsync();
      expect(consoleSpy).toHaveBeenNthCalledWith(5, "resolve", "test1");
      expect(consoleSpy).toHaveBeenNthCalledWith(6, "resolve", undefined);
      expect(consoleSpy).toHaveBeenCalledTimes(6);

      wrapper.unmount();
      await vi.runAllTimersAsync();
      stream$.next("test2");
      expect(consoleSpy).toHaveBeenNthCalledWith(7, "resolve", "test2");
      expect(consoleSpy).toHaveBeenCalledTimes(7);
    });
  });
});
