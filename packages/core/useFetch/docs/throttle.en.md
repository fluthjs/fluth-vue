# Throttle

## Usage

You can control whether `useFetch` uses throttling through the `throttle` parameter

```ts
const { execute } = useFetch(url, { immediate: false, throttle: 100 });

setTimeout(() => execute(), 30); // executes
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // executes
setTimeout(() => execute(), 30);
```

::: warning Note

- The `throttle` condition applies to reactive updates (`refetch`), automatic updates (`refresh`), and manual execution (`execute`)

- When `throttle` is set, `execute` no longer returns a Promise. You can use `promise$.then` for subsequent actions
:::

## Advanced Usage

You can also control `useFetch` throttling through the `throttle`'s await and options parameters. The usage and effect are the same as [lodash.throttle](https://lodash.com/docs/4.17.15#throttle)

```ts
const { execute } = useFetch(url, {
  immediate: false,
  throttle: { wait: 100, options: { leading: false, trailing: true } },
});

setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // executes
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // executes
``` 