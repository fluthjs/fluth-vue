# 更新机制

## 响应式更新 (refetch)

通过设置 `refetch` 为 `true`，当响应式数据 `url` 或者 `payload` 发生变化时，`useFetch` 会自动触发新的请求。

### URL 更新

使用 `ref` 作为 URL 参数，当 URL 发生变化时自动触发请求：

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get(payload).json();

url.value = "https://my-api.com/user/2"; // ✅ 触发新请求
```

### URL Stream 更新

使用 `Stream` 或 `Observable` 作为 URL 参数：

```ts
import { $, useFetch } from "fluth-vue";

const url = $("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get().json();

url.next("https://my-api.com/user/2"); // ✅ 触发新请求
```

### POST 载荷更新

#### Ref 更新

```ts
const payload = ref({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.value.id = 2; // ✅ 触发新请求
```

#### Reactive 更新

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.id = 2; // ✅ 触发新请求
```

#### Stream 更新

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.next({ id: 2 }); // ✅ 触发新请求
```

### GET 参数更新

#### Ref 更新

```ts
const payload = ref({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.value.id = 2; // ✅ 触发新请求: https://example.com?id=2
```

#### Reactive 更新

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.id = 2; // ✅ 触发新请求: https://example.com?id=2
```

#### Stream 更新

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.next({ id: 2 }); // ✅ 触发新请求: https://example.com?id=2
```

## 自动刷新 (refresh)

### 类型定义

```typescript
refresh?: number; // 刷新间隔（毫秒）
```

### 基础用法

设置 `refresh` 参数使 `useFetch` 定时自动发起请求：

```ts
// 每 5 秒自动刷新数据
const { data, cancelRefresh } = useFetch(url, {
  refresh: 5000,
});

// 取消自动刷新
cancelRefresh();
```

### 与其他选项结合

```ts
const { data, cancelRefresh } = useFetch("/api/notifications", {
  refresh: 30000, // 30秒刷新一次
  refetch: true, // 启用响应式更新
  condition: isVisible, // 只在页面可见时刷新
  retry: 3, // 失败时重试3次
}).json();
```
