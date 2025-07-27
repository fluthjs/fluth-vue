# Throttle

## Type Definition

```typescript
throttle?:
  | number  // Simple interval time (milliseconds)
  | {
      wait: number;          // Interval time (milliseconds)
      options?: {
        leading?: boolean;   // Whether to execute at the start of interval
        trailing?: boolean;  // Whether to execute at the end of interval
      };
    };
```

## Return Value Notes

::: warning Important Notes

- After setting `throttle`, `execute()` no longer returns a Promise
- Use `promise$.then()` to handle request results
- Use reactive states like `data`, `error`, `loading` to get results
  :::

```ts
const { execute, promise$, data, loading, error } = useFetch(url, {
  immediate: false,
  throttle: 1000,
});

// ❌ Wrong usage - execute doesn't return Promise
// const result = await execute();

// ✅ Correct usage - use promise$
promise$.then((result) => {
  console.log("Request successful:", result);
});

// ✅ Or use reactive states
watch(data, (newData) => {
  if (newData) {
    console.log("Data updated:", newData);
  }
});

execute(); // Trigger throttled request
```

## Examples

### Basic Usage

Control `useFetch` throttle behavior through the `throttle` parameter to limit request frequency:

```ts
const { execute } = useFetch(url, {
  immediate: false,
  throttle: 1000, // Execute at most once per second
});

// Frequent calls, but execute at most once per second
execute(); // ✅ Execute immediately
execute(); // ❌ Ignored by throttle
execute(); // ❌ Ignored by throttle
// Can execute again after 1 second
```

### leading: Leading Edge Execution

```ts
// leading: true - Execute immediately at interval start (default behavior)
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: true, trailing: false },
  },
});

execute(); // ✅ Execute immediately
execute(); // ❌ Ignored by throttle
// All calls within 1 second are ignored
```

### trailing: Trailing Edge Execution

```ts
// trailing: true - Execute last call at interval end
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: false, trailing: true },
  },
});

execute(); // ❌ Wait for interval end
execute(); // ❌ Wait for interval end
execute(); // ✅ Execute after 1 second (last call)
```

### Combined Configuration

```ts
// leading + trailing: May execute at both interval start and end
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: true, trailing: true },
  },
});

execute(); // ✅ Execute immediately (leading)
execute(); // Record, wait for trailing
execute(); // Record, wait for trailing
// After 1 second, if there are recorded calls, execute once (trailing)
```

## Combined with Other Options

### Combined with refresh

```ts
// Auto refresh + throttle, avoid being too frequent
const { data, cancelRefresh } = useFetch("/api/status", {
  refresh: 100, // Try to refresh every 100ms
  throttle: 1000, // But actually execute at most once per 1000ms
}).json();
```

### Combined with condition

```ts
const isOnline = ref(true);

const { execute } = useFetch("/api/sync", {
  immediate: false,
  throttle: 2000, // Throttle 2 seconds
  condition: isOnline, // Only execute when online
  retry: 3,
});
```

### Difference from debounce

```ts
// ❌ Cannot use debounce and throttle together
// debounce: Delay execution, frequent calls reset timer
// throttle: Limit frequency, ensure execution at most once within fixed interval

// Debounce: Suitable for search input
const searchDebounced = useFetch("/api/search", {
  debounce: 300, // Search 300ms after stopping input
});

// Throttle: Suitable for scroll events
const scrollThrottled = useFetch("/api/track", {
  throttle: 200, // Record at most once per 200ms
});
```
