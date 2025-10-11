/**
 * Network mocking with MSW.
 * Import this helper into the specific tests that need to make network requests.
 */

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll } from "vitest";

const defaultJsonMessage = { hello: "world" };
const defaultTextMessage = "Hello World";
const baseUrl = "https://example.com";

/**
 * Create a Newline Delimited JSON (NDJSON) stream response
 * @param count Number of JSON objects to send (default: 3)
 * @param interval Interval between objects in milliseconds (default: 1000)
 * @param customData Custom data objects array to send (each object will be sent as one line)
 */
function createNDJSONStream(count = 3, interval = 1000, customData?: any[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // If customData is provided, use it directly as NDJSON objects
        if (customData && Array.isArray(customData)) {
          for (let eventCount = 0; eventCount < count; eventCount++) {
            let data;

            if (eventCount < customData.length) {
              // Use custom data if available
              data = customData[eventCount];
            } else {
              // Generate {count: x} objects for remaining items
              data = { count: eventCount + 1 };
            }

            // Send as NDJSON (one JSON object per line)
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));

            // Wait for interval before next object (except for last object)
            if (eventCount < count - 1) {
              await new Promise((resolve) => setTimeout(resolve, interval));
            }
          }
        } else {
          // Default behavior: generate objects with sequential data
          for (let eventCount = 1; eventCount <= count; eventCount++) {
            const data = {
              type: "data",
              message: `Event ${eventCount}`,
              timestamp: new Date().toISOString(),
              count: eventCount,
              total: count,
            };

            // Send as NDJSON (one JSON object per line)
            controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));

            // Wait for interval before next object (except for last object)
            if (eventCount < count) {
              await new Promise((resolve) => setTimeout(resolve, interval));
            }
          }
        }

        // Send final completion object
        const finalData = {
          type: "complete",
          message: "Stream completed",
          count: count,
        };
        controller.enqueue(encoder.encode(JSON.stringify(finalData) + "\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },

    cancel() {
      // Cleanup if stream is cancelled
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

/**
 * Create a Server-Sent Events (SSE) stream response
 * @param count Number of events to send (default: 3)
 * @param interval Interval between events in milliseconds (default: 1000)
 * @param customData Custom data to send in events
 */
function createSSEStream(count = 3, interval = 1000, customData?: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let eventCount = 1; eventCount <= count; eventCount++) {
          let message;
          if (customData) {
            if (count <= customData.length) {
              // Split customData into count parts
              const partSize = Math.ceil(customData.length / count);
              const startIndex = (eventCount - 1) * partSize;
              const endIndex = Math.min(
                startIndex + partSize,
                customData.length,
              );
              message = customData.slice(startIndex, endIndex);
            } else {
              // Send one character at a time if count > customData length
              if (eventCount <= customData.length) {
                message = customData[eventCount - 1];
              } else {
                // If we've sent all characters, send empty or repeat last char
                message = "";
              }
            }
          } else {
            // Default structure
            message = `Event ${eventCount}`;
          }

          const data = `{"type":"data","message":"${message}","timestamp":"${new Date().toISOString()}","count":${eventCount},"total":${count}}`;
          const event = `data: ${data}\n\n`;

          controller.enqueue(encoder.encode(event));

          // Wait for interval before next event (except for last event)
          if (eventCount < count) {
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        }

        // Send final completion event
        const finalEvent = `data: {"type":"complete","message":"Stream completed","count":${count}}\n\n`;
        controller.enqueue(encoder.encode(finalEvent));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },

    cancel() {
      // Cleanup if stream is cancelled
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

function createResponse(request: Request) {
  const url = new URL(request.url);
  const qs = url.searchParams;

  let response: Response;

  if (qs.get("stream") != null) {
    // Handle SSE stream response
    const count = qs.get("count") ? Number(qs.get("count")) : 3;
    const interval = qs.get("interval") ? Number(qs.get("interval")) : 1000;
    const customData = qs.get("data") || undefined;
    response = createSSEStream(count, interval, customData);
  } else if (qs.get("ndjson") != null) {
    // Handle NDJSON stream response
    const count = qs.get("count") ? Number(qs.get("count")) : 3;
    const interval = qs.get("interval") ? Number(qs.get("interval")) : 1000;

    let customData: any[] | undefined;
    const dataParam = qs.get("data");
    if (dataParam) {
      try {
        // Try to parse as JSON array
        customData = JSON.parse(dataParam);
        if (!Array.isArray(customData)) {
          customData = undefined;
        }
      } catch (e) {
        console.error(e);
        // If parsing fails, create default objects with the string as message
        customData = Array.from({ length: count }, (_, i) => ({
          type: "data",
          message: dataParam,
          timestamp: new Date().toISOString(),
          count: i + 1,
          total: count,
        }));
      }
    }

    response = createNDJSONStream(count, interval, customData);
  } else if (qs.get("text") != null) {
    response = HttpResponse.text(qs.get("text") ?? defaultTextMessage);
  } else if (qs.get("json") != null) {
    const jsonVal = qs.get("json");
    const jsonData = jsonVal?.length ? JSON.parse(jsonVal) : defaultJsonMessage;
    response = HttpResponse.json(jsonData);
  } else {
    response = HttpResponse.json(defaultJsonMessage);
  }

  // Apply status code if specified
  if (qs.get("status")) {
    const status = Number(qs.get("status"));
    response = new HttpResponse(response.body, {
      status,
      headers: response.headers,
    });
  }

  // Apply delay if specified
  if (qs.get("delay")) {
    const delay = Number(qs.get("delay"));
    return new Promise<Response>((resolve) => {
      setTimeout(() => resolve(response), delay);
    });
  }

  return response;
}

/**
 * Allow the client to define the response body.
 * @example https://example.com?status=400 will respond with { status: 400 }.
 * @example https://example.com?json will respond with the default json message ({ hello: 'world' }).
 * @example https://example.com?text will respond with the default text message ('Hello World').
 * @example https://example.com?delay=1000 will respond in 1000ms.
 * @example https://example.com?status=301&text=thanks&delay=1000
 *          will respond in 1000ms with statusCode 300 and the response body "thanks" as a string
 * @example https://example.com?stream will respond with a Server-Sent Events (SSE) stream
 * @example https://example.com?stream&count=5&interval=500
 *          will send 5 SSE events with 500ms interval between each event
 * @example https://example.com?stream&data=hello
 *          will send SSE events with custom message "hello"
 * @example https://example.com?stream&count=5&data=hello
 *          will send each character "h", "e", "l", "l", "o" in separate events
 * @example https://example.com?stream&count=2&data=hello
 *          will split "hello" into 2 parts: "hel" and "lo"
 * @example https://example.com?ndjson will respond with a Newline Delimited JSON (NDJSON) stream
 * @example https://example.com?ndjson&count=5&interval=500
 *          will send 5 JSON objects with 500ms interval between each object
 * @example https://example.com?ndjson&data=hello
 *          will send JSON objects with custom message "hello" in each object
 * @example https://example.com?ndjson&data=[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]
 *          will send the provided JSON array as separate NDJSON objects
 * @example https://example.com?ndjson&count=3&data=[{"type":"user","name":"Alice"},{"type":"user","name":"Bob"}]
 *          will send first 3 objects from the provided array (limited by count)
 */
const server = setupServer(
  http.post(baseUrl, async ({ request }) => {
    const url = new URL(request.url);
    const qs = url.searchParams;

    // Check if query parameters specify response format
    if (
      qs.get("text") != null ||
      qs.get("json") != null ||
      qs.get("stream") != null ||
      qs.get("ndjson") != null ||
      qs.get("status") ||
      qs.get("delay")
    ) {
      const response = createResponse(request);
      return response instanceof Promise ? await response : response;
    }

    // Default behavior: Echo back the request payload for POST requests
    const body = await request.text();
    try {
      const jsonBody = JSON.parse(body);
      return HttpResponse.json(jsonBody);
    } catch {
      return HttpResponse.text(body || defaultTextMessage);
    }
  }),

  http.get(baseUrl, async ({ request }) => {
    const response = createResponse(request);
    return response instanceof Promise ? await response : response;
  }),

  // Another duplicate route for the sole purpose of re-triggering requests on url change.
  http.get(`${baseUrl}/test`, async ({ request }) => {
    const response = createResponse(request);
    return response instanceof Promise ? await response : response;
  }),

  http.get(`${baseUrl}/url`, ({ request }) => {
    return HttpResponse.text(request.url.toString());
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
