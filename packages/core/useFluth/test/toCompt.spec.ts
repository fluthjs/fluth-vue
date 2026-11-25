import { beforeEach, describe, expect, it, vi } from "vitest";
import { isReactive } from "vue";
import { $ } from "../index";

describe("toCompt function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should convert Stream with initial value to ComputedRef", () => {
    const stream$ = $("initial value");
    const stream$Compt = stream$.toCompt();
    expect(stream$Compt.value).toBe("initial value");
  });

  it("should convert Stream without initial value to ComputedRef with undefined", () => {
    const stream$ = $<string>();
    const stream$Compt = stream$.toCompt();
    expect(stream$Compt.value).toBeUndefined();
  });

  it("should update ComputedRef when Stream value changes", async () => {
    const stream$ = $("initial value");
    const stream$Compt = stream$.toCompt();

    stream$.next("new value");
    expect(stream$Compt.value).toBe("new value");
  });

  it("should handle Observable as input", async () => {
    const promise$ = $(1);
    const observable = promise$.then((value) => value + 1);
    const observableCompt = observable.toCompt();

    expect(observableCompt.value).toBeUndefined();
    promise$.next(2);
    expect(observableCompt.value).toBe(3);
  });

  it("should handle type inference correctly", () => {
    const streamWithInitial$ = $("string value");
    const streamWithInitial$Compt = streamWithInitial$.toCompt();
    const stringValue: string = streamWithInitial$Compt.value;
    expect(typeof stringValue).toBe("string");

    const streamWithoutInitial$ = $<number>();
    const streamWithoutInitial$Compt = streamWithoutInitial$.toCompt();
    expect(streamWithoutInitial$Compt.value).toBeUndefined();

    streamWithoutInitial$.next(42);
    expect(typeof streamWithoutInitial$Compt.value).toBe("number");
  });

  it("should use shallowRef without wrapping immutable objects in a deep reactive proxy", () => {
    const initialObj = { nested: { count: 1 } };
    const stream$ = $(initialObj);
    const compt = stream$.toCompt();

    expect(isReactive(compt.value)).toBe(false);
    expect(compt.value).toBe(initialObj);

    const nextObj = { nested: { count: 2 } };
    stream$.next(nextObj);
    expect(isReactive(compt.value)).toBe(false);
    expect(compt.value).toBe(nextObj);
  });

  it("should throw descriptive error with correct toCompt name on invalid this", () => {
    const stream$ = $(1);
    expect(() => stream$.toCompt.call({} as any)).toThrow(
      "toCompt only accepts Stream or Observable as input",
    );
  });
});
