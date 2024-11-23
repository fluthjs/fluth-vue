# 重试

## 用法

```ts
const { data, error } = useFetch("/api/user", {
  retry: 3, // 失败后最多重试3次
});
```

:::warning 提示

设置`retry`选项后，在没有达到最大重试次数前:

- `error`不会更新;
- `loading`会一直处于`true`状态直到重试结束;
- `promise$`也只会在重试结束后对结果进行推流。
  :::
