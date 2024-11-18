# 条件

## 用法

可以通过 `condition` 参数来控制 `useFetch` 是否发起请求

```ts
const payload = ref({ id: 1 });

const condition = computed(() => !!payload.value.id);

const { data } = useFetch(url, { refetch: true, condition }).get(payload).json();

payload.value.id = 2; // 将触发另一个请求

payload.value.id = null; // 将不会触发另一个请求
```

::: warning 提示
`condition`的条件对响应式更新`refetch`、自动更新`refresh`、手动执行`execute`都生效
:::
