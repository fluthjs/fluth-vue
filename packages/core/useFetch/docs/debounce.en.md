# Debounce

## Type Definition

```typescript
debounce?:
  | number  // Simple delay time (milliseconds)
  | {
      wait: number;          // Delay time (milliseconds)
      options?: {
        leading?: boolean;   // Whether to execute before the delay starts
        maxWait?: number;    // Maximum wait time
        trailing?: boolean;  // Whether to execute after the delay ends
      };
    };
```

## Return Value Notes

::: warning Important Notes

- After setting debounce, execute() no longer returns a Promise
- Use promise$.then() to handle request results
- Use reactive states like data, error, loading to get results
  :::

```ts
const { execute, promise$, data, loading, error } = useFetch(url, {
  immediate: false,
  debounce: 300,
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

execute(); // Trigger debounced request
```

## Examples

### Basic Usage

Control useFetch debounce behavior through the debounce parameter to avoid frequent request triggers:

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: 300, // 300ms debounce
});

// Rapid consecutive calls, only the last one will execute
execute();
execute();
execute(); // ✅ Only this one will execute after 300ms
```

### leading: Leading Edge Trigger

```ts
// leading: true - Execute immediately on first call
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { leading: true, trailing: false },
  },
});

execute(); // ✅ Execute immediately
execute(); // ❌ Cancelled by debounce
execute(); // ❌ Cancelled by debounce
```

### trailing: Trailing Edge Trigger

```ts
// trailing: true - Execute after delay on last call (default behavior)
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { leading: false, trailing: true },
  },
});

execute(); // ❌ Cancelled by subsequent calls
execute(); // ❌ Cancelled by subsequent calls
execute(); // ✅ Execute after 300ms
```

### maxWait: Maximum Wait Time

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { maxWait: 1000 },
  },
});

// Even with continuous calls, will force execute once at 1000ms
```

## Combined with Other Options

### Combined with refetch

```ts
const query = ref("");

const { data } = useFetch("/api/search", {
  debounce: 300, // Debounce delay
  refetch: true, // Reactive updates
  condition: () => query.value.length > 2, // Condition restriction
})
  .get(() => ({ q: query.value }))
  .json();
```

### Combined with retry

```ts
const { execute } = useFetch("/api/data", {
  immediate: false,
  debounce: 500, // Debounce
  retry: 3, // Retry on failure
  onFetchError: ({ error }) => {
    console.error("Request failed:", error);
  },
});
```
