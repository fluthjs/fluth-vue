# 防抖

## 用法

可以通过 `debounce` 参数来控制 `useFetch` 是否防抖

```ts
const { execute } = useFetch(url, { immediate: false, debounce: 100 });

setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // 只生效一次
```

::: warning 提示

- `debounce`的条件对响应式更新`refetch`、自动更新`refresh`、手动执行`execute`都生效

- 设置`debounce`后`execute`执行后不再返回 Promise, 可以通过`promise$.then`来进行后续动作
  :::

## 高阶用法

也可以通过 `debounce`的 await 和 options 参数来控制 `useFetch` 是否防抖， 用法和效果与 [lodash.debounce](https://lodash.com/docs/4.17.15#debounce) 相同

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: { wait: 100, options: { leading: true, trailing: true } },
});

setTimeout(() => execute(), 30); // 生效一次
setTimeout(() => execute(), 30);
setTimeout(() => execute(), 30); // 生效一次
```
