# Retry

## Usage

```ts
const { data, error } = useFetch("/api/user", {
  retry: 3, // Retry up to 3 times after failure
});
```

:::warning Note

After setting the retry option, before reaching the maximum retry count:

- error will not be updated;
- loading will remain true until retries are complete;
- promise$ will only stream the result after retries are finished.
  :::
