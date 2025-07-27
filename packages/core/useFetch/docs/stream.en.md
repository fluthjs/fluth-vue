# Data Stream

## Type Definition

```typescript
// promise$ in useFetch return value
promise$: Stream<T | undefined, true>;
```

## Background

After `useFetch` executes a request, in addition to providing reactive `data`, it also provides data stream support based on [fluth](https://fluthjs.github.io/fluth-doc/). Through `promise$`, you can subscribe to the results of each request, enabling more flexible asynchronous data processing.

## Basic Usage

### Subscribe to Request Results

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

// Subscribe to success results
promise$.then((data) => {
  console.log("Request successful:", data);
});

// Subscribe to error results
promise$.catch((error) => {
  console.log("Request failed:", error);
});

execute(); // Trigger request, promise$ will push results
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

console.log(results.length); // 3 - Each execute pushes a result
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

console.log(streamData.length); // 2 - Cache hits also push
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
    console.log("Error:", error); // 4xx/5xx errors are pushed to catch
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

With the powerful operators provided by [fluth](https://fluthjs.github.io/fluth-doc/), complex data processing can be implemented in a very simple way.

```ts
import { promiseAll, map } from "fluth-vue";

const { promise$: stream1 } = useFetch("/api/data1");
const { promise$: stream2 } = useFetch("/api/data2");

// Combine multiple data streams
const all$ = promiseAll(stream1, stream2);
```
