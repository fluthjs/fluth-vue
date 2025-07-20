# Throttle

## Usage

You can control whether `useFetch` throttles through the `throttle` parameter

```ts
const { execute } = useFetch(url, { immediate: false, throttle: 100 });

setTimeout(() => execute(), 30); // Takes effect
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Takes effect
setTimeout(() => execute(), 30);
```

::: warning Note

- The `throttle` condition applies to reactive updates `refetch`, auto updates `refresh`, and manual execution `execute`

- After setting `throttle`, `execute` no longer returns a Promise. You can use `promise$.then` for subsequent actions
:::

## Advanced Usage

You can also control whether `useFetch` throttles through the `wait` and `options` parameters of `throttle`. The usage and effect are the same as [lodash.throttle](https://lodash.com/docs/4.17.15#throttle)

```ts
const { execute } = useFetch(url, {
  immediate: false,
  throttle: { wait: 100, options: { leading: false, trailing: true } },
});

setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Takes effect
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // Takes effect
```