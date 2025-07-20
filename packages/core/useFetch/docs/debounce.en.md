# Debounce

## Usage

You can control whether `useFetch` debounces through the `debounce` parameter

```ts
const { execute } = useFetch(url, { immediate: false, debounce: 100 });

setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Only takes effect once
```

::: warning Note

- The `debounce` condition applies to reactive updates `refetch`, auto updates `refresh`, and manual execution `execute`

- When `debounce` is set, `execute` no longer returns a Promise after execution. You can use `promise$.then` for subsequent actions
:::

## Advanced Usage

You can also control whether `useFetch` debounces through the `debounce` wait and options parameters. Usage and effect are the same as [lodash.debounce](https://lodash.com/docs/4.17.15#debounce)

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: { wait: 100, options: { leading: true, trailing: true } },
});

setTimeout(() => execute(), 30); // Takes effect once
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Takes effect once
```