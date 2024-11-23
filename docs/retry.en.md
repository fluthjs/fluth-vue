# Retry

## Usage

```ts
const { data, error } = useFetch("/api/user", {
  retry: 3, // Retry up to 3 times on failure
});
```

:::warning Note
When the `retry` option is set, before reaching the maximum retry count:

- The `error` state won't be updated
- The `loading` state will remain `true` until all retries are completed
- The `promise$` stream will only emit the result after all retries are completed
  :::
