# Data Stream (Stream)

## Type Definition

```typescript
// promise$ in useFetch return value
promise$: Stream<T | undefined>;
```

## Background

After useFetch executes a request, in addition to providing reactive data, it also provides a data stream promise$ based on [fluth](https://fluthjs.github.io/fluth-doc/). Through promise$, you can subscribe to the result of each request, enabling more flexible asynchronous data processing.

## Usage

### Subscribe to Request Results

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

// Subscribe to success result
promise$.then((data) => {
  console.log("Request successful:", data);
});

// Subscribe to error result
promise$.catch((error) => {
  console.log("Request failed:", error);
});

execute(); // Trigger request, promise$ will push result
```

### Stream Input and Output

Async request methods wrapped with useFetch, using streams as input and output, can implement stream programming.

```ts
const url$ = $("https://api.example.com/data");
const payload$ = $({ id: 1, name: "fluth" });
const { promise$ } = useFetch(url$, { immediate: false, refetch: true })
  .get(payload$)
  .json();

promise$.then((data) => {
  console.log(data);
});

url$.next("https://api.example.com/data2"); // Trigger request and print result
payload$.next({ id: 2, name: "vue" }); // Trigger request and print result
```

### Streaming Response Support

useFetch automatically detects and supports two streaming response formats:

#### SSE (Server-Sent Events) Stream

When the server response has `Content-Type` of `text/event-stream`, useFetch automatically enables SSE stream processing mode.

```ts
const { promise$ } = useFetch("https://api.example.com/events", {
  immediate: false,
});

// Subscribe to SSE event stream
promise$.then((chunk) => {
  console.log("Received SSE data:", chunk);
});

execute(); // Start receiving SSE stream
```

#### NDJSON (Newline Delimited JSON) Stream

When the server response has `Content-Type` of `application/x-ndjson`, useFetch automatically enables NDJSON stream processing mode.

```ts
const { promise$ } = useFetch("https://api.example.com/data-stream", {
  immediate: false,
});

// Subscribe to NDJSON object stream
promise$.then((jsonObject) => {
  console.log("Received JSON object:", jsonObject);
});

execute(); // Start receiving NDJSON stream
```
