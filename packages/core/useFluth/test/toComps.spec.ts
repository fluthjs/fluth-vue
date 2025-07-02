import { beforeEach, describe, expect, it, vi } from "vitest";
import { $, toComps } from "../index";

describe("toComps function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should convert object with Stream properties to computed refs", () => {
    const stream1 = $("value1");
    const stream2 = $(42);
    const target = {
      prop1: stream1,
      prop2: stream2,
      normalProp: "not a stream",
    };

    const result = toComps(target);

    expect(result.prop1.value).toBe("value1");
    expect(result.prop2.value).toBe(42);
    expect(result.normalProp).toBe("not a stream");
  });

  it("should convert object with Observable properties to computed refs", () => {
    const stream = $("initial");
    const observable = stream.then((value) => value + " processed");
    const target = {
      obs: observable,
      normalProp: "not observable",
    };

    const result = toComps(target);

    expect(result.obs.value).toBeUndefined();
    expect(result.normalProp).toBe("not observable");

    stream.next("new");
    expect(result.obs.value).toBe("new processed");
  });

  it("should handle mixed Stream and Observable properties", () => {
    const stream1 = $("stream value");
    const stream2 = $(10);
    const observable = stream2.then((value) => value * 2);

    const target = {
      streamProp: stream1,
      observableProp: observable,
      regularProp: "regular",
      numberProp: 123,
    };

    const result = toComps(target);

    expect(result.streamProp.value).toBe("stream value");
    expect(result.observableProp.value).toBeUndefined();
    expect(result.regularProp).toBe("regular");
    expect(result.numberProp).toBe(123);

    stream2.next(5);
    expect(result.observableProp.value).toBe(10);
  });

  it("should update computed refs when Stream values change", () => {
    const stream1 = $("initial1");
    const stream2 = $("initial2");
    const target = {
      prop1: stream1,
      prop2: stream2,
    };

    const result = toComps(target);

    expect(result.prop1.value).toBe("initial1");
    expect(result.prop2.value).toBe("initial2");

    stream1.next("updated1");
    stream2.next("updated2");

    expect(result.prop1.value).toBe("updated1");
    expect(result.prop2.value).toBe("updated2");
  });

  it("should handle empty object", () => {
    const target = {};
    const result = toComps(target);
    expect(result).toEqual({});
  });

  it("should handle object with only non-stream properties", () => {
    const target = {
      prop1: "string",
      prop2: 123,
      prop3: true,
      prop4: null,
      prop5: undefined,
    };

    const result = toComps(target);
    expect(result).toEqual({
      prop1: "string",
      prop2: 123,
      prop3: true,
      prop4: null,
      prop5: undefined,
    });
  });

  it("should handle Streams without initial values", () => {
    const stream1 = $<string>();
    const stream2 = $<number>();
    const target = {
      prop1: stream1,
      prop2: stream2,
    };

    const result = toComps(target);

    expect(result.prop1.value).toBeUndefined();
    expect(result.prop2.value).toBeUndefined();

    stream1.next("first value");
    stream2.next(42);

    expect(result.prop1.value).toBe("first value");
    expect(result.prop2.value).toBe(42);
  });

  it("should throw error for non-object input", () => {
    expect(() => toComps("string")).toThrow("comComps param must be object");
    expect(() => toComps(123)).toThrow("comComps param must be object");
    expect(() => toComps([])).toThrow("comComps param must be object");
    expect(() => toComps(null)).toThrow("comComps param must be object");
    expect(() => toComps(undefined)).toThrow("comComps param must be object");
  });

  it("should preserve all properties and convert streams to computed refs", () => {
    const stream1 = $("value1");
    const stream2 = $("value2");
    const target = {
      nested: {
        stream: stream1,
      },
      stream: stream2,
      regular: "not a stream",
    };

    const result = toComps(target);

    expect(Object.keys(result).sort()).toEqual(["nested", "regular", "stream"]);
    expect(result.stream.value).toBe("value2");
    expect(result.nested).toEqual({ stream: stream1 });
    expect(result.regular).toBe("not a stream");
  });

  it("should handle complex data types in streams", () => {
    const objectStream = $({ name: "test", value: 123 });
    const arrayStream = $([1, 2, 3]);
    const target = {
      objectProp: objectStream,
      arrayProp: arrayStream,
    };

    const result = toComps(target);

    expect(result.objectProp.value).toEqual({ name: "test", value: 123 });
    expect(result.arrayProp.value).toEqual([1, 2, 3]);

    objectStream.next({ name: "updated", value: 456 });
    arrayStream.next([4, 5, 6]);

    expect(result.objectProp.value).toEqual({ name: "updated", value: 456 });
    expect(result.arrayProp.value).toEqual([4, 5, 6]);
  });

  it("should only convert top-level Stream/Observable properties", () => {
    const topLevelStream = $("top level");
    const nestedStream = $("nested");
    const target = {
      topStream: topLevelStream,
      nested: {
        innerStream: nestedStream,
        regularProp: "regular",
      },
      regularProp: "top regular",
    };

    const result = toComps(target);

    // Top level stream should be converted to computed ref
    expect(result.topStream.value).toBe("top level");

    // Nested object should be preserved as-is (streams inside are not converted)
    expect(result.nested).toEqual({
      innerStream: nestedStream,
      regularProp: "regular",
    });

    // Regular properties should be preserved
    expect(result.regularProp).toBe("top regular");

    // Verify nested stream is still the original stream object
    expect(result.nested.innerStream).toBe(nestedStream);
  });
});
