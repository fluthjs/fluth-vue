import { beforeEach, describe, expect, it, vi } from "vitest";
import { $, toComp } from "../index";

describe("toComp function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should convert Stream with initial value to ComputedRef", () => {
    const stream = $("initial value");
    const result = toComp(stream);
    expect(result.value).toBe("initial value");
  });

  it("should convert Stream without initial value to ComputedRef with undefined", () => {
    const stream = $<string>();
    const result = toComp(stream);
    expect(result.value).toBeUndefined();
  });

  it("should update ComputedRef when Stream value changes", async () => {
    const stream = $("initial value");
    const result = toComp(stream);

    stream.next("new value");
    expect(result.value).toBe("new value");
  });

  it("should handle Observable as input", async () => {
    const promise$ = $(1);
    const observable = promise$.then((value) => value + 1);
    const result = toComp(observable);

    expect(result.value).toBeUndefined();
    promise$.next(2);
    expect(result.value).toBe(3);
  });

  it("should handle type inference correctly", () => {
    const streamWithInitial = $("string value");
    const resultWithInitial = toComp(streamWithInitial);
    const stringValue: string = resultWithInitial.value;
    expect(typeof stringValue).toBe("string");

    const streamWithoutInitial = $<number>();
    const resultWithoutInitial = toComp(streamWithoutInitial);
    expect(resultWithoutInitial.value).toBeUndefined();

    streamWithoutInitial.next(42);
    expect(typeof resultWithoutInitial.value).toBe("number");
  });
});
