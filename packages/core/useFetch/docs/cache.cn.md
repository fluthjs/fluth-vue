# 缓存

## 类型定义

```typescript
cacheSetting?: {
  expiration?: number;
  cacheResolve?: (config: InternalConfig & { url: string }) => string;
}
```

## 基础用法

通过 cacheSetting 参数启用请求缓存功能：

```javascript
import { useFetch } from "fluth-vue";

const { data, execute, clearCache } = useFetch(url, {
  cacheSetting: {
    // 缓存过期时间（毫秒）
    expiration: 1000 * 60 * 5, // 5分钟
    // 缓存键生成函数
    cacheResolve: ({ url, payload, method, type }) =>
      `${method}:${url}:${JSON.stringify(payload)}`,
  },
})
  .post(payload)
  .json();
```

## 缓存选项

### cacheResolve

生成缓存键的函数，用于标识不同的请求：

```javascript
// 基于 URL 缓存
cacheResolve: ({ url }) => url;

// 基于 URL 和载荷缓存
cacheResolve: ({ url, payload }) => url + JSON.stringify(payload);

// 基于完整请求配置缓存
cacheResolve: ({ url, payload, method, type }) =>
  `${method}:${url}:${type}:${JSON.stringify(payload)}`;
```

### expiration

缓存过期时间（毫秒）。设置后，缓存将在指定时间后自动清除：

```javascript
const { data } = useFetch(url, {
  cacheSetting: {
    expiration: 1000 * 60 * 10, // 10分钟后过期
    cacheResolve: ({ url }) => url,
  },
});
```

## 缓存管理

### 实例缓存清除

每个 useFetch 实例都有独立的 clearCache 方法：

```javascript
const { clearCache } = useFetch(url, {
  cacheSetting: { cacheResolve: ({ url }) => url },
});

// 清除当前实例的缓存
clearCache();
```

### 全局缓存清除

清除所有 useFetch 实例的缓存：

```javascript
import { clearFetchCache } from "fluth-vue";

// 清除全局缓存
clearFetchCache();
```

## 缓存行为

### 命中缓存

当缓存命中时：

- ✅ 直接返回缓存数据，不发起网络请求
- ✅ `execute()` 返回 `Promise.resolve(cacheData)`
- ✅ data 状态立即更新
- ✅ promise$ 会推送缓存数据流

### 缓存存储

- **存储位置**：内存中的 Map 对象
- **生命周期**：页面刷新后清除
- **容量限制**：无硬性限制，受浏览器内存约束

## 实际场景

### 用户信息缓存

```javascript
const { data: userInfo } = useFetch("/api/user", {
  cacheSetting: {
    expiration: 1000 * 60 * 30, // 30分钟
    cacheResolve: ({ url }) => url,
  },
}).json();
```

### 分页数据缓存

```javascript
const page = ref(1);
const { data: list } = useFetch("/api/posts", {
  refetch: true,
  cacheSetting: {
    expiration: 1000 * 60 * 5, // 5分钟
    cacheResolve: ({ url, payload }) => `${url}:page:${payload.page}`,
  },
})
  .get(computed(() => ({ page: page.value })))
  .json();
```

::: warning 注意事项

- 缓存仅存储在内存中，页面刷新后会丢失
- 缓存键相同的请求会共享缓存数据
- 过期时间到达后缓存会自动清除
- 命中缓存时不会触发 loading 状态变化
  :::
