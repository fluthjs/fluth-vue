# Cache

## Instance Cache

Implement `useFetch` request caching by setting the `cacheSetting` parameter.

```javascript
import { useFetch } from "fluth-vue";

const { data, execute, promise$, clearCache } = useFetch(url, {
  cacheSetting: {
    expiration: 1000 * 60 * 5;
    cacheResolve: ({url, payload}) => url + payload.id;
  }.post(payload).json();
});

```

::: warning Note

- Current cache implementation is stored in memory
- When `execute` hits cache, it returns Promise.resolve(cacheData), so you can use `execute.then` for subsequent actions
- When cache is hit, `promise$` will not stream

:::

## Global Cache

You can use `clearFetchCache` to clear all `useFetch` caches

```javascript
import { clearFetchCache } from "fluth-vue";

clearFetchCache();
```