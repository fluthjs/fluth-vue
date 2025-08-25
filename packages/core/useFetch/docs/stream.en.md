# Data Stream (Stream)

## Type Definition

```typescript
// promise$ in useFetch return value
promise$: Stream<T | undefined, true>;
```

## Background

After useFetch executes a request, in addition to providing reactive data, it also provides a data stream promise$ based on [fluth](https://fluthjs.github.io/fluth-doc/). Through promise$, you can subscribe to the result of each request, enabling more flexible asynchronous data processing.

## Basic Usage

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

### Handling Success and Failure

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

promise$
  .then((data) => {
    console.log("Success:", data);
  })
  .catch((error) => {
    console.log("Failure:", error);
  });

await execute(); // Normal response, promise$ pushes success result
```

## Core Features

### Each Request Will Push

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

const results: any[] = [];
promise$.then((data) => {
  results.push(data);
});

await execute(); // First request
await execute(); // Second request
await execute(); // Third request

console.log(results.length); // 3 - Each execute will push a result
```

### Cache Hits Also Push

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
  cacheSetting: {
    cacheResolve: ({ url }) => url,
  },
});

const streamData: any[] = [];
promise$.then((data) => {
  streamData.push(data);
});

await execute(); // First request, fetch from server
await execute(); // Cache hit, promise$ still pushes cached data

console.log(streamData.length); // 2 - Cache hit also pushes
```

### Error Handling

```ts
const { execute, promise$ } = useFetch("https://api.example.com/error", {
  immediate: false,
});

promise$
  .then((data) => {
    console.log("Success:", data);
  })
  .catch((error) => {
    console.log("Error:", error); // 4xx/5xx errors will be pushed to catch
  });

try {
  await execute(); // If returns 400/500 errors
} catch (error) {
  // execute itself also throws errors
}
```

## Difference from Reactive Data

### Reactive Data (data)

```ts
const { data, execute } = useFetch("https://api.example.com/user", {
  immediate: false,
});

// Watch data changes
watch(data, (newData, oldData) => {
  console.log("Data updated:", newData);
});

await execute(); // data.value updates, triggers watch
```

### Data Stream (promise$)

With the powerful operators provided by [fluth](https://fluthjs.github.io/fluth-doc/), you can implement complex data processing in a very simple way.

```ts
import { promiseAll, map } from "fluth-vue";

const { promise$: stream1 } = useFetch("/api/data1");
const { promise$: stream2 } = useFetch("/api/data2");

// Combine multiple data streams
const all$ = promiseAll(stream1, stream2);
```
