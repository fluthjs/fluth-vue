import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, reactive, isReactive } from "vue";
import { $, recover$, Stream, Observable } from "../index";

describe("recover$ function", () => {
  it("should recover Stream instances from a reactive object", async () => {
    const state = reactive({
      a$: $("initial-a"),
      b$: $(10),
    });

    const { a$, b$ } = recover$(state);

    expect(a$).toBeInstanceOf(Stream);
    expect(b$).toBeInstanceOf(Stream);
    expect(isReactive(a$)).toBe(false);
    expect(a$.value).toBe("initial-a");
    expect(b$.value).toBe(10);

    a$.next("updated-a");
    b$.next(20);

    expect(state.a$).toBe("updated-a");
    expect(state.b$).toBe(20);
  });

  it("should trigger Vue template updates when recovered streams emit", async () => {
    let recoveredA$!: Stream<string>;
    let recoveredB$!: Stream<number>;

    const TestComponent = defineComponent({
      template: `<div data-testid="out">{{ state.a$ }}-{{ state.b$ }}</div>`,
      setup() {
        const state = reactive({
          a$: $("hello"),
          b$: $(1),
        });
        const { a$, b$ } = recover$(state);
        recoveredA$ = a$;
        recoveredB$ = b$;
        return { state };
      },
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.find('[data-testid="out"]').text()).toBe("hello-1");

    recoveredA$.next("world");
    recoveredB$.next(2);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="out"]').text()).toBe("world-2");
  });

  it("should preserve derived Observables and mixed plain properties on the raw object", () => {
    const source$ = $(5);
    const doubled$ = source$.thenImmediate((v) => v * 2);
    const state = reactive({
      source$,
      doubled$,
      label: "plain",
    });

    const raw = recover$(state);

    expect(raw.source$).toBeInstanceOf(Stream);
    expect(raw.doubled$).toBeInstanceOf(Observable);
    expect(raw.doubled$.value).toBe(10);
    expect(raw.label).toBe("plain");

    raw.source$.next(7);
    expect(state.doubled$).toBe(14);
  });

  it("should handle empty and already-plain objects safely", () => {
    const empty = reactive({});
    expect(recover$(empty)).toEqual({});

    const plain = { x$: $(1) };
    const recovered = recover$(plain);
    expect(recovered).toBe(plain);
    expect(recovered.x$).toBeInstanceOf(Stream);
  });
});
