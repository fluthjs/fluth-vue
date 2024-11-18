# 更新

## 响应式更新

通过设置`refetch`为 `true`，当响应式数据 `url` 或者 `payload` 发生变化时 可以使 `useFetch` 函数在响应式数据发生变化时自动触发另一个请求。

### url 更新

使用 `ref` 作为 url 参数将允许 `useFetch` 函数在 url 发生变化时自动触发另一个请求。

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get(payload).json();

url.value = "https://my-api.com/user/2"; // 将触发另一个请求
```

### post ref 更新

使用 `ref`或者`computed` 作为 `post` payload 参数将允许 `useFetch` 函数在 payload 发生变化时自动触发另一个请求。

```ts
const payload = ref({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.value.id = 2; // 将触发另一个请求
```

### post reactive 更新

使用 `reactive` 作为 `post` payload 参数将允许 `useFetch` 函数在 payload 发生变化时自动触发另一个请求。

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.id = 2; // 将触发另一个请求
```

### get ref 更新

使用 `ref`或者`computed` 作为 `get` payload 参数将允许 `useFetch` 函数在 payload 发生变化时自动触发另一个请求。

```ts
const payload = ref({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true }).get(payload).json();

payload.value.id = 2; // 将触发另一个请求 https://example.com?id=2
```

### get reactive 更新

使用 `reactive` 作为 `get` payload 参数将允许 `useFetch` 函数在 payload 发生变化时自动触发另一个请求。

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true }).get(payload).json();

payload.value.id = 2; // 将触发另一个请求 https://example.com?id=2
```

## 自动更新

可以通过 `refresh` 参数来设置 `useFetch` 定时自动更新请求。

```ts
// 每300毫秒自动更新data
const { data } = useFetch(url, { refresh: 300 });
```
