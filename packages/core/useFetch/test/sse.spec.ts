/**
 * SSE (Server-Sent Events) stream tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { retry } from "./utils";

window.fetch = nodeFetch as any;

describe("useFetch with SSE stream", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    vi.spyOn(window, "fetch");
    vi.spyOn(console, "log");
  });
  it("should handle basic SSE stream correctly", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=1",
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache");
    expect(res.headers.get("connection")).toBe("keep-alive");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read the entire stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          received += chunk;
        }
      } catch {
        // Stream might be cancelled, that's ok
      }

      expect(received).toContain("data:");
      expect(received).toContain("Event 1");
      expect(received).toContain('"type":"complete"');
    }
  });

  it("should handle SSE stream with custom count and interval", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=2&interval=50",
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read the entire stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          received += chunk;
        }
      } catch {
        // Stream might be cancelled, that's ok
      }

      // Should have received events for count=2
      expect(received).toContain("Event 1");
      expect(received).toContain("Event 2");
      expect(received).toContain('"type":"complete"');
    }
  }, 10000); // Increase timeout to 10 seconds

  it("should handle SSE stream with custom data", async () => {
    const customMessage = "Hello World Custom";
    const { response, statusCode } = useFetch(
      `https://example.com?stream&count=1&data=${encodeURIComponent(customMessage)}`,
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read first chunk
      const { value } = await reader.read();
      if (value) {
        received = decoder.decode(value);
      }

      reader.cancel();

      expect(received).toContain(`"message":"${customMessage}"`);
      expect(received).toContain('"type":"data"');
      expect(received).toContain('"count":1');
      expect(received).toContain('"total":1');
    }
  });

  it("should work with POST requests and stream parameter", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=1",
      {
        method: "POST",
        body: '{"test": "data"}',
      },
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      const { value } = await reader.read();

      if (value) {
        const received = decoder.decode(value);
        expect(received).toContain("data:");
        expect(received).toContain("Event 1");
      }

      reader.cancel();
    }
  });

  it("should support stream with delay parameter", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=1&delay=50", // Reduce delay for more stable testing
    );

    await retry(
      () => {
        expect(statusCode.value).toBe(200);
        expect(response.value).toBeDefined();
      },
      { timeout: 5000 },
    ); // Increase retry timeout significantly

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      const { value } = await reader.read();

      if (value) {
        const received = decoder.decode(value);
        expect(received).toContain("Event 1");
        expect(received).toContain('"type":"data"');
      }

      reader.cancel();
    }
  });

  it("should split custom data into parts when count < data length", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=2&data=hello",
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read the entire stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          received += chunk;
        }
      } catch {
        // Stream might be cancelled, that's ok
      }

      // Should split "hello" into 2 parts: "hel" and "lo"
      expect(received).toContain('"message":"hel"');
      expect(received).toContain('"message":"lo"');
      expect(received).toContain('"total":2');
    }
  });

  it("should send characters one by one when count > data length", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=6&data=hi&interval=10",
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read the entire stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          received += chunk;
        }
      } catch {
        // Stream might be cancelled, that's ok
      }

      // Should send "h", "i", "", "", "", "" (6 events total)
      expect(received).toContain('"message":"h"');
      expect(received).toContain('"message":"i"');
      expect(received).toContain('"message":""'); // Empty messages for remaining events
      expect(received).toContain('"total":6');
      expect(received).toContain('"count":1');
      expect(received).toContain('"count":2');
    }
  }, 10000);

  it("should work with exact count matching data length", async () => {
    const { response, statusCode } = useFetch(
      "https://example.com?stream&count=5&data=hello&interval=10",
    );

    await retry(() => {
      expect(statusCode.value).toBe(200);
      expect(response.value).toBeDefined();
    });

    const res = response.value;
    if (!res) throw new Error("Response is null");

    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let received = "";

      // Read the entire stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          received += chunk;
        }
      } catch {
        // Stream might be cancelled, that's ok
      }

      // Should send each character: "h", "e", "l", "l", "o"
      expect(received).toContain('"message":"h"');
      expect(received).toContain('"message":"e"');
      expect(received).toContain('"message":"l"');
      expect(received).toContain('"message":"o"');
      expect(received).toContain('"total":5');
    }
  }, 10000);
});
