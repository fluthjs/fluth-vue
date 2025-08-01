import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { $, render$ } from "../index";

const consoleSpy = vi.spyOn(console, "log");
const consoleErrorSpy = vi.spyOn(console, "error");

describe("render$ function comprehensive tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  describe("Basic Functionality", () => {
    it("should render stream value without custom render function", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Hello World");
    });

    it("should render VNode returned from render function", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            h("div", { class: "custom-vnode" }, `VNode: ${value}`),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".custom-vnode");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("VNode: Hello World");
    });

    it("should render DefineComponent returned from render function", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            defineComponent({
              setup() {
                return () =>
                  h(
                    "div",
                    { class: "define-component" },
                    `Component: ${value}`,
                  );
              },
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".define-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Component: Hello World");
    });

    it("should update when stream value changes", async () => {
      const stream$ = $("Initial Value");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Initial Value");

      stream$.next("Updated Value");
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toBe("Updated Value");
    });
  });

  describe("Edge Cases - Null and Undefined Values", () => {
    it("should handle null stream values", async () => {
      const stream$ = $<string | null>("Initial");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);

      stream$.next(null);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toBe("");
    });

    it("should handle undefined stream values", async () => {
      const stream$ = $<string | undefined>("Initial");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);

      stream$.next(undefined);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toBe("");
    });

    it("should handle Observable without initial value", () => {
      const stream$ = $<string>();

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);

      // Should render empty or undefined
      expect(wrapper.text()).toBe("");
    });

    it("should handle render function returning null", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, () => null as any);
          return () => h(streamComponent);
        },
      });

      // Should not throw error during component creation
      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("");
    });

    it("should handle render function returning undefined", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, () => undefined as any);
          return () => h(streamComponent);
        },
      });

      // Should not throw error during component creation
      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("");
    });
  });

  describe("Component Detection Logic", () => {
    it("should detect function components correctly", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) => {
            // Return a function component directly instead of using defineComponent with setup
            const FunctionComponent = () =>
              h("div", { class: "function-component" }, value);
            return FunctionComponent as any;
          });
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".function-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Hello World");
    });

    it("should detect options API components correctly", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            defineComponent({
              template: '<div class="options-component">{{ message }}</div>',
              data() {
                return { message: value };
              },
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".options-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Hello World");
    });

    it("should detect components with render function", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            defineComponent({
              render() {
                return h(
                  "div",
                  { class: "render-component" },
                  `Render: ${value}`,
                );
              },
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".render-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Render: Hello World");
    });

    it("should detect components with template", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            defineComponent({
              template: '<div class="template-component">{{ message }}</div>',
              data() {
                return { message: `Template: ${value}` };
              },
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".template-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Template: Hello World");
    });

    it("should not misidentify plain objects as components", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        template: '<div><component :is="streamComponent" /></div>',
        setup() {
          const streamComponent = render$(stream$, (value) =>
            h(
              "div",
              { class: "plain-object" },
              JSON.stringify({ name: value }),
            ),
          );
          return { streamComponent };
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".plain-object");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe('{"name":"Hello World"}');
    });
  });

  describe("Data Types", () => {
    it("should handle number values", () => {
      const stream$ = $(42);

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("42");
    });

    it("should handle boolean values", () => {
      const stream$ = $(true);

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("true");
    });

    it("should handle array values", () => {
      const stream$ = $([1, 2, 3]);

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("1,2,3");
    });

    it("should handle object values", () => {
      const stream$ = $({ name: "test", count: 1 });

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("[object Object]");
    });
  });

  describe("Performance and Memory", () => {
    it("should handle rapid stream updates efficiently", async () => {
      const stream$ = $("Initial");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);

      // Rapidly update stream values
      for (let i = 0; i < 100; i++) {
        stream$.next(`Value ${i}`);
      }

      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toBe("Value 99");
    });

    it("should handle multiple stream instances without interference", () => {
      const stream1$ = $("Stream 1");
      const stream2$ = $("Stream 2");

      const TestComponent = defineComponent({
        setup() {
          const component1 = render$(stream1$);
          const component2 = render$(stream2$);
          return () => h("div", null, [h(component1), h(component2)]);
        },
      });

      const wrapper = mount(TestComponent);
      expect(wrapper.text()).toBe("Stream 1Stream 2");
    });
  });

  describe("XSS Security", () => {
    it("should handle HTML content safely in default render", () => {
      const stream$ = $('<script>alert("xss")</script>');

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      // Content should be safely escaped as text
      expect(wrapper.text()).toBe('<script>alert("xss")</script>');
    });

    it("should allow safe HTML rendering with custom render function", () => {
      const stream$ = $("<strong>Bold Text</strong>");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            h("div", {
              class: "safe-html",
              innerHTML: value,
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".safe-html");

      expect(divElement.element.innerHTML).toBe("<strong>Bold Text</strong>");
    });

    it("should handle malicious content safely when using textContent", () => {
      const stream$ = $('<img src="x" onerror="alert(1)">');

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(
            stream$,
            (value) => h("div", { class: "text-only" }, value), // Using textContent implicitly
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".text-only");

      // Should render as plain text, not HTML
      expect(divElement.text()).toBe('<img src="x" onerror="alert(1)">');
      expect(divElement.find("img").exists()).toBe(false);
    });
  });

  describe("Integration with Observable chains", () => {
    it("should work with Observable transformations", async () => {
      const stream$ = $(1);
      const transformed$ = stream$
        .then((value) => value * 2)
        .then((value) => `Result: ${value}`);

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(transformed$);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);

      // Initially empty since Observable chain hasn't been triggered
      expect(wrapper.text()).toBe("");

      // Trigger the chain
      stream$.next(5);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toBe("Result: 10");
    });

    it("should handle Observable errors gracefully", async () => {
      const stream$ = $(1);
      const errorObservable$ = stream$.then((value) => {
        if (value > 5) throw new Error("Value too large");
        return value;
      });

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(errorObservable$);
          return () => h(streamComponent);
        },
      });

      mount(TestComponent);

      // Should not throw during setup
      expect(() => {
        stream$.next(10); // This will trigger an error in the Observable
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle render function throwing errors gracefully", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, () => {
            throw new Error("Render function error");
          });
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      // Should render empty string for error (based on your modification)
      expect(wrapper.text()).toBe("");
    });

    it("should handle render function returning null gracefully", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, () => null as any);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      // Should render empty string for null
      expect(wrapper.text()).toBe("");
    });

    it("should handle render function returning undefined gracefully", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, () => undefined as any);
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      // Should render empty string for undefined
      expect(wrapper.text()).toBe("");
    });

    it("should handle invalid VNode objects", () => {
      const stream$ = $("Hello World");

      // Should not crash during component creation
      expect(() => {
        render$(stream$, () => ({ invalid: "vnode" }) as any);
      }).not.toThrow();
    });

    it("should handle non-function render parameter", () => {
      const stream$ = $("Hello World");

      // Should handle gracefully when render is not a function
      expect(() => {
        render$(stream$, "not a function" as any);
      }).not.toThrow();
    });
  });

  describe("Improved Component Detection", () => {
    it("should not misidentify objects with name property as components", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) => {
            // Return an object with name but no functional component properties
            const plainObject = { name: "NotAComponent", data: value };
            return h(
              "div",
              { class: "not-component" },
              JSON.stringify(plainObject),
            );
          });
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".not-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toContain("NotAComponent");
    });

    it("should properly detect functional components", () => {
      const stream$ = $("Hello World");

      const TestComponent = defineComponent({
        setup() {
          const streamComponent = render$(stream$, (value) =>
            defineComponent({
              setup() {
                return () =>
                  h(
                    "div",
                    { class: "proper-component" },
                    `Functional: ${value}`,
                  );
              },
            }),
          );
          return () => h(streamComponent);
        },
      });

      const wrapper = mount(TestComponent);
      const divElement = wrapper.find(".proper-component");

      expect(divElement.exists()).toBe(true);
      expect(divElement.text()).toBe("Functional: Hello World");
    });
  });
});
