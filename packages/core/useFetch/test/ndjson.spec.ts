/**
 * NDJSON (Newline Delimited JSON) stream tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { retry } from "./utils";

let spyConsoleLog: any;
let fetchSpy: any;

window.fetch = nodeFetch as any;

describe("useFetch with NDJSON stream", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    spyConsoleLog = vi.spyOn(console, "log");
    fetchSpy = vi.spyOn(window, "fetch");
  });

  it("should handle basic NDJSON stream correctly", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=1",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(fetchSpy).toBeCalledTimes(1);
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "Event 1",
          count: 1,
          total: 1,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 1,
        }),
      );
    });
  });

  it("should handle NDJSON stream with custom count and interval", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=2&interval=50",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(3);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "Event 1",
          count: 1,
          total: 2,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "Event 2",
          count: 2,
          total: 2,
        }),
      );
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 2,
        }),
      );
    });
  });

  it("should handle NDJSON stream with custom data", async () => {
    const customMessage = "Hello World Custom";
    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?ndjson&count=1&data=${encodeURIComponent(customMessage)}`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: customMessage,
          count: 1,
          total: 1,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 1,
        }),
      );
    });
  });

  it("should work with POST requests and ndjson parameter", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=1",
      {
        method: "POST",
        body: '{"test": "data"}',
      },
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "Event 1",
          count: 1,
          total: 1,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 1,
        }),
      );
    });
  });

  it("should support ndjson with delay parameter", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=1&delay=50", // Reduce delay for more stable testing
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "Event 1",
          count: 1,
          total: 1,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 1,
        }),
      );
    });
  });

  it("should use custom string data in each object when count < data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=2&data=hello&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(3);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 1,
          total: 2,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 2,
          total: 2,
        }),
      );
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 2,
        }),
      );
    });
  });

  it("should use custom string data in each object when count > data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=6&data=hi&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(7);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 1,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 2,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 3,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[3][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 4,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[4][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 5,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[5][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hi",
          count: 6,
          total: 6,
        }),
      );
      expect(spyConsoleLog.mock.calls[6][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 6,
        }),
      );
    });
  });

  it("should use custom string data in each object when count matches data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=5&data=hello&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(6);
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 1,
          total: 5,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 2,
          total: 5,
        }),
      );
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 3,
          total: 5,
        }),
      );
      expect(spyConsoleLog.mock.calls[3][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 4,
          total: 5,
        }),
      );
      expect(spyConsoleLog.mock.calls[4][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "hello",
          count: 5,
          total: 5,
        }),
      );
      expect(spyConsoleLog.mock.calls[5][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 5,
        }),
      );
    });
  });

  it("should handle malformed JSON gracefully", async () => {
    // Create a custom mock server response that includes malformed JSON
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?ndjson&count=1&data=invalid{json",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      // The first call should contain the malformed JSON as raw text
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          type: "data",
          message: "invalid{json",
          count: 1,
          total: 1,
        }),
      );
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 1,
        }),
      );
    });
  });

  it("should handle custom JSON object array", async () => {
    const customObjects = [
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 35 },
    ];
    const dataParam = encodeURIComponent(JSON.stringify(customObjects));

    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?ndjson&count=3&data=${dataParam}&interval=10`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(4);

      // Check that each custom object is received
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(customObjects[0]);
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(customObjects[1]);
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(customObjects[2]);
      expect(spyConsoleLog.mock.calls[3][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 3,
        }),
      );
    });
  });

  it("should limit custom JSON array by count parameter", async () => {
    const customObjects = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
      { id: 4, name: "David" },
      { id: 5, name: "Eve" },
    ];
    const dataParam = encodeURIComponent(JSON.stringify(customObjects));

    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?ndjson&count=2&data=${dataParam}&interval=10`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(3);

      // Should only receive first 2 objects due to count limit
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(customObjects[0]);
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(customObjects[1]);
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 2,
        }),
      );
    });
  });

  it("should handle mixed data types in JSON array", async () => {
    const mixedObjects = [
      { type: "user", name: "Alice", active: true },
      { type: "product", title: "Widget", price: 29.99 },
      { type: "order", id: "12345", items: ["item1", "item2"] },
    ];
    const dataParam = encodeURIComponent(JSON.stringify(mixedObjects));

    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?ndjson&count=3&data=${dataParam}&interval=10`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(4);

      // Check that each mixed object is received correctly
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(mixedObjects[0]);
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(mixedObjects[1]);
      expect(spyConsoleLog.mock.calls[2][0]).toEqual(mixedObjects[2]);
      expect(spyConsoleLog.mock.calls[3][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 3,
        }),
      );
    });
  });

  it("should generate {count: x} objects when count > customData array length", async () => {
    const customObjects = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const dataParam = encodeURIComponent(JSON.stringify(customObjects));

    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?ndjson&count=5&data=${dataParam}&interval=10`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(6);

      // First 2 objects should be from customData
      expect(spyConsoleLog.mock.calls[0][0]).toEqual(customObjects[0]);
      expect(spyConsoleLog.mock.calls[1][0]).toEqual(customObjects[1]);

      // Remaining 3 objects should be {count: x} format
      expect(spyConsoleLog.mock.calls[2][0]).toEqual({ count: 3 });
      expect(spyConsoleLog.mock.calls[3][0]).toEqual({ count: 4 });
      expect(spyConsoleLog.mock.calls[4][0]).toEqual({ count: 5 });

      // Final completion object
      expect(spyConsoleLog.mock.calls[5][0]).toEqual(
        expect.objectContaining({
          type: "complete",
          message: "Stream completed",
          count: 5,
        }),
      );
    });
  });
});
