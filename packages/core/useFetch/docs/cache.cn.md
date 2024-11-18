# 缓存

## 实例缓存

通过设置 `cacheSetting` 参数来实现 `useFetch` 请求的缓存，

```javascript
import { useFetch } from "fluth-vue";

const { data, execute, promise$, clearCache } = useFetch(url, {
  cacheSetting: {
    expiration: 1000 * 60 * 5;
    cacheResolve: ({url, payload}) => url + payload.id;
  }.post(payload).json();
});

```

::: warning 提示

- 当前缓存实现是存在内存中
- `execute`命中缓存返回的是 Promise.resolve(cacheData)，所以可以使用`execute.then`来进行后续动作
- 命中缓存`promise$`不会推流

:::

## 全局缓存

可以通过 `clearFetchCache` 来清空所有 `useFetch` 的缓存

```javascript
import { clearFetchCache } from "fluth-vue";

clearFetchCache();
```
