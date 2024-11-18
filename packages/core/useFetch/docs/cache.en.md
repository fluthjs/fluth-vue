# Cache

## Instance Cache

Configure caching for `useFetch` requests by setting the `cacheSetting` parameter:

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
- When `execute` hits the cache, it returns Promise.resolve(cacheData), so you can use `execute.then` for subsequent actions
- When cache is hit, `promise$` will not emit a stream
:::

## Global Cache

You can clear all `useFetch` caches using `clearFetchCache`:

```javascript
import { clearFetchCache } from "fluth-vue";

clearFetchCache();
``` 