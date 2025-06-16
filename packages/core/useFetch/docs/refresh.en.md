# Refresh

## Reactive Updates

By setting `refetch` to `true`, `useFetch` can automatically trigger a new request when reactive data like `url` or `payload` changes.

### URL Updates

Using a `ref` as the url parameter allows `useFetch` to automatically trigger a new request when the url changes.

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get(payload).json();

url.value = "https://my-api.com/user/2"; // Will trigger a new request
```

### URL Stream Updates

Using a `stream` or `observable` as the url parameter allows `useFetch` to automatically trigger a new request when the url changes.

```ts
import { $, useFetch } from "fluth-vue";

const url = $("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get().json();

url.next("https://my-api.com/user/2"); // Will trigger a new request
```

### Post Ref Updates

Using a `ref` or `computed` as the `post` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
const payload = ref({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.value.id = 2; // Will trigger a new request
```

### Post Reactive Updates

Using `reactive` as the `post` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.id = 2; // Will trigger a new request
```

### Post Stream Updates

Using a `stream` or `observable` as the `post` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.next({ id: 2 }); // Will trigger a new request
```

### Get Ref Updates

Using a `ref` or `computed` as the `get` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
const payload = ref({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.value.id = 2; // Will trigger a new request to https://example.com?id=2
```

### Get Reactive Updates

Using `reactive` as the `get` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.value.id = 2; // Will trigger a new request to https://example.com?id=2
```

### Get Stream Updates

Using a `stream` or `observable` as the `get` payload parameter allows `useFetch` to automatically trigger a new request when the payload changes.

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.next({ id: 2 }); // Will trigger a new request to https://example.com?id=2
```

## Auto Refresh

You can set `useFetch` to automatically refresh requests at intervals using the `refresh` parameter.

```ts
// Automatically refresh data every 300ms
const { data } = useFetch(url, { refresh: 300 });
```
