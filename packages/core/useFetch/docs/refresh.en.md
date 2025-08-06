# Update Mechanisms

## Reactive Updates (refetch)

By setting refetch to true, useFetch automatically triggers new requests when reactive data url or payload changes.

### URL Updates

Using a ref as the URL parameter to automatically trigger requests when the URL changes:

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get(payload).json();

url.value = "https://my-api.com/user/2"; // ✅ Triggers new request
```

### URL Stream Updates

Using Stream or Observable as URL parameter:

```ts
import { $, useFetch } from "fluth-vue";

const url = $("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get().json();

url.next("https://my-api.com/user/2"); // ✅ Triggers new request
```

### POST Payload Updates

#### Ref Updates

```ts
const payload = ref({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.value.id = 2; // ✅ Triggers new request
```

#### Reactive Updates

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.id = 2; // ✅ Triggers new request
```

#### Stream Updates

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.next({ id: 2 }); // ✅ Triggers new request
```

### GET Parameter Updates

#### Ref Updates

```ts
const payload = ref({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.value.id = 2; // ✅ Triggers new request: https://example.com?id=2
```

#### Reactive Updates

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.id = 2; // ✅ Triggers new request: https://example.com?id=2
```

#### Stream Updates

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.next({ id: 2 }); // ✅ Triggers new request: https://example.com?id=2
```

## Auto Refresh (refresh)

### Type Definition

```typescript
refresh?: number; // Refresh interval (milliseconds)
```

### Basic Usage

Set the refresh parameter to make useFetch automatically send requests at regular intervals:

```ts
// Auto refresh data every 5 seconds
const { data, cancelRefresh } = useFetch(url, {
  refresh: 5000,
});

// Cancel auto refresh
cancelRefresh();
```

### Combined with Other Options

```ts
const { data, cancelRefresh } = useFetch("/api/notifications", {
  refresh: 30000, // Refresh every 30 seconds
  refetch: true, // Enable reactive updates
  condition: isVisible, // Only refresh when page is visible
  retry: 3, // Retry 3 times on failure
}).json();
```
