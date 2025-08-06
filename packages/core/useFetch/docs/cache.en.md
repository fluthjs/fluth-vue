# Cache

## Type Definition

```typescript
cacheSetting?: {
  expiration?: number;
  cacheResolve?: (config: InternalConfig & { url: string }) => string;
}
```

## Basic Usage

Enable request caching through the `cacheSetting` parameter:

```javascript
import { useFetch } from "fluth-vue";

const { data, execute, clearCache } = useFetch(url, {
  cacheSetting: {
    // Cache expiration time (milliseconds)
    expiration: 1000 * 60 * 5, // 5 minutes
    // Cache key generation function
    cacheResolve: ({ url, payload, method, type }) =>
      `${method}:${url}:${JSON.stringify(payload)}`,
  },
})
  .post(payload)
  .json();
```

## Cache Options

### cacheResolve

Function to generate cache keys for identifying different requests:

```javascript
// Cache based on URL
cacheResolve: ({ url }) => url;

// Cache based on URL and payload
cacheResolve: ({ url, payload }) => url + JSON.stringify(payload);

// Cache based on complete request configuration
cacheResolve: ({ url, payload, method, type }) =>
  `${method}:${url}:${type}:${JSON.stringify(payload)}`;
```

### expiration

Cache expiration time in milliseconds. When set, cache will be automatically cleared after the specified time:

```javascript
const { data } = useFetch(url, {
  cacheSetting: {
    expiration: 1000 * 60 * 10, // Expires after 10 minutes
    cacheResolve: ({ url }) => url,
  },
});
```

## Cache Management

### Instance Cache Clearing

Each useFetch instance has its own `clearCache` method:

```javascript
const { clearCache } = useFetch(url, {
  cacheSetting: { cacheResolve: ({ url }) => url },
});

// Clear current instance cache
clearCache();
```

### Global Cache Clearing

Clear cache for all useFetch instances:

```javascript
import { clearFetchCache } from "fluth-vue";

// Clear global cache
clearFetchCache();
```

## Cache Behavior

### Cache Hit

When cache is hit:

- ✅ Returns cached data directly without network request
- ✅ `execute()` returns `Promise.resolve(cacheData)`
- ✅ data state updates immediately
- ✅ promise$ will push cached data stream

### Cache Storage

- **Storage Location**: In-memory `Map` object
- **Lifecycle**: Cleared after page refresh
- **Capacity Limit**: No hard limit, constrained by browser memory

## Practical Scenarios

### User Information Cache

```javascript
const { data: userInfo } = useFetch("/api/user", {
  cacheSetting: {
    expiration: 1000 * 60 * 30, // 30 minutes
    cacheResolve: ({ url }) => url,
  },
}).json();
```

### Paginated Data Cache

```javascript
const page = ref(1);
const { data: list } = useFetch("/api/posts", {
  refetch: true,
  cacheSetting: {
    expiration: 1000 * 60 * 5, // 5 minutes
    cacheResolve: ({ url, payload }) => `${url}:page:${payload.page}`,
  },
})
  .get(computed(() => ({ page: page.value })))
  .json();
```

::: warning Important Notes

- Cache is only stored in memory and will be lost after page refresh
- Requests with the same cache key will share cached data
- Cache will be automatically cleared when expiration time is reached
- Cache hits do not trigger loading state changes
  :::
