---
sidebarDepth: 2
---

# useFetch

Based on [vueuse/useFetch](https://vueuse.org/core/useFetch/), with support for new features like caching, auto updates, conditional requests, and streams

## Usage

```javascript
import { useFetch } from "fluth-vue";

const { data, loading, error, promise$ } = useFetch("https://example.com");
```

## Use Cases

useFetch is used to handle relationships between asynchronous data, generally with the following three use cases:

### Declarative + Reactive Relationship

For example, `data2` and `data1` in the following example:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com", { refetch: true }).post(payload).json();
const data1 = ref({ a: 1 });
// Usage
const { data: data2 } = useFetchApi(data1);
```

- `data2` and `data1` form a declarative relationship through the `useFetchApi` function, without needing to care about the details of producing `data2`
- `data2` and `data1` form a reactive relationship through the `useFetchApi` function, `data2` will change as `data1` changes

### Declarative Relationship

For example, `data2` and `data1` in the following example:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2, execute: fetchData2 } = useFetchApi(data1);
```

- `data2` and `data1` form a declarative relationship through the `useFetchApi` function
- Update `data2` by calling the `fetchData2` function, which will use the latest `data1` as the request parameter

### Call Relationship

For example, `data2` and `data1` in the following example:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Record<string, any>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2 } = await useFetchApi(data1.value);
```

- `data2` is obtained by calling the `useFetchApi` async function and taking the current value of `data1` as the request parameter in real-time

### Stream

useFetch provides not only reactive data input and reactive data output, but also supports fluth streams.
Streams can be used as both input and output for useFetch, allowing async requests to be handled as nodes in stream programming. See [promise$](/en/useFetch/stream) for details.
