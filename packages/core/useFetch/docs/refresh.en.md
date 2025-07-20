# Updates

## Reactive Updates

By setting `refetch` to `true`, `useFetch` can automatically trigger another request when reactive data `url` or `payload` changes.

### URL Updates

Using a `ref` as the url parameter allows the `useFetch` function to automatically trigger another request when the url changes.

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get(payload).json();

url.value = "https://my-api.com/user/2"; // Will trigger another request
```

### URL Stream Updates

Using a `stream` or `observable` as the url parameter allows the `useFetch` function to automatically trigger another request when the url changes.

```ts
import { $, useFetch } from "fluth-vue";

const url = $("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true }).get().json();

url.next("https://my-api.com/user/2"); // Will trigger another request
```

### POST Ref Updates

Using a `ref` or `computed` as the `post` payload parameter allows the `useFetch` function to automatically trigger another request when the payload changes.

```ts
const payload = ref({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.value.id = 2; // Will trigger another request
```

### POST Reactive Updates

Using `reactive` as the `post` payload parameter allows the `useFetch` function to automatically trigger another request when the payload changes.

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.id = 2; // Will trigger another request
```

### POST Stream Updates

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch(url, { refetch: true }).post(payload).json();

payload.next({ id: 2 }); // Will trigger another request
```

### GET Ref Updates

Using a `ref` or `computed` as the `get` payload parameter allows the `useFetch` function to automatically trigger another request when the payload changes.

```ts
const payload = ref({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.value.id = 2; // Will trigger another request https://example.com?id=2
```

### GET Reactive Updates

Using `reactive` as the `get` payload parameter allows the `useFetch` function to automatically trigger another request when the payload changes.

```ts
const payload = reactive({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.id = 2; // Will trigger another request https://example.com?id=2
```

### GET Stream Updates

```ts
import { $, useFetch } from "fluth-vue";

const payload = $({ id: 1 });

const { data } = useFetch("https://example.com", { refetch: true })
  .get(payload)
  .json();

payload.next({ id: 2 }); // Will trigger another request https://example.com?id=2
```

## Auto Updates

You can set `useFetch` to automatically update requests at regular intervals using the `refresh` parameter.

```ts
// Auto update data every 300 milliseconds
const { data } = useFetch(url, { refresh: 300 });
```
