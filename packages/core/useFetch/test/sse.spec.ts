/**
 * SSE (Server-Sent Events) stream tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { retry } from "./utils";

let spyConsoleLog: any;
let fetchSpy: any;

window.fetch = nodeFetch as any;

describe("useFetch with SSE stream", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    spyConsoleLog = vi.spyOn(console, "log");
    fetchSpy = vi.spyOn(window, "fetch");
  });
  it("should handle basic SSE stream correctly", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=1",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(fetchSpy).toBeCalledTimes(1);
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("Event 1");
      expect(spyConsoleLog.mock.calls[1][0]).toContain('"type":"complete"');
    });
  });

  it("should handle SSE stream with custom count and interval", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=2&interval=50",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(3);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("Event 1");
      expect(spyConsoleLog.mock.calls[1][0]).toContain("Event 2");
      expect(spyConsoleLog.mock.calls[2][0]).toContain('"type":"complete"');
    });
  }); // Increase timeout to 10 seconds

  it("should handle SSE stream with custom data", async () => {
    const customMessage = "Hello World Custom";
    const { response, statusCode, promise$ } = useFetch(
      `https://example.com?stream&count=1&data=${encodeURIComponent(customMessage)}`,
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("Hello World Custom");
      expect(spyConsoleLog.mock.calls[1][0]).toContain('"type":"complete"');
    });
  });

  it("should work with POST requests and stream parameter", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=1",
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
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("Event 1");
      expect(spyConsoleLog.mock.calls[1][0]).toContain('"type":"complete"');
    });
  });

  it("should support stream with delay parameter", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=1&delay=50", // Reduce delay for more stable testing
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(2);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("Event 1");
      expect(spyConsoleLog.mock.calls[1][0]).toContain('"type":"complete"');
    });
  });

  it("should split custom data into parts when count < data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=2&data=hello&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(3);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("hel");
      expect(spyConsoleLog.mock.calls[1][0]).toContain("lo");
      expect(spyConsoleLog.mock.calls[2][0]).toContain('"type":"complete"');
    });
  });

  it("should send characters one by one when count > data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=6&data=hi&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(7);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("h");
      expect(spyConsoleLog.mock.calls[1][0]).toContain("i");
      expect(spyConsoleLog.mock.calls[2][0]).toContain("3");
      expect(spyConsoleLog.mock.calls[3][0]).toContain("4");
      expect(spyConsoleLog.mock.calls[4][0]).toContain("5");
      expect(spyConsoleLog.mock.calls[5][0]).toContain("6");
      expect(spyConsoleLog.mock.calls[6][0]).toContain('"type":"complete"');
    });
  });

  it("should work with exact count matching data length", async () => {
    const { response, statusCode, promise$ } = useFetch(
      "https://example.com?stream&count=5&data=hello&interval=10",
    );

    promise$.then((data) => {
      console.log(data);
    });

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
      expect(spyConsoleLog).toBeCalledTimes(6);
      expect(spyConsoleLog.mock.calls[0][0]).toContain("data:");
      expect(spyConsoleLog.mock.calls[0][0]).toContain("h");
      expect(spyConsoleLog.mock.calls[1][0]).toContain("e");
      expect(spyConsoleLog.mock.calls[2][0]).toContain("l");
      expect(spyConsoleLog.mock.calls[3][0]).toContain("l");
      expect(spyConsoleLog.mock.calls[4][0]).toContain("o");
      expect(spyConsoleLog.mock.calls[5][0]).toContain('"type":"complete"');
    });
  });
});
