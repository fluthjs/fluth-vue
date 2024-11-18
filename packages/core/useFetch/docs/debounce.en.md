# Debounce

## Usage

You can control whether `useFetch` debounces requests using the `debounce` parameter

```ts
const { execute } = useFetch(url, { immediate: false, debounce: 100 });

setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Only executes once
```

::: warning Note

- The `debounce` condition applies to reactive updates (`refetch`), automatic updates (`refresh`), and manual execution (`execute`)

- When `debounce` is set, `execute` no longer returns a Promise. You can use `promise$.then` for subsequent actions
:::

## Advanced Usage

You can also control `useFetch` debouncing through the `debounce` parameter's wait time and options, which works the same way as [lodash.debounce](https://lodash.com/docs/4.17.15#debounce)

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: { wait: 100, options: { leading: true, trailing: true } },
});

setTimeout(() => execute(), 30); // Executes once
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Executes once
``` 