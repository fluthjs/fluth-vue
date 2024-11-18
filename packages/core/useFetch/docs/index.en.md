---
sidebarDepth: 2
---

# useFetch

Based on [vueuse/useFetch](https://vueuse.org/core/useFetch/), with additional support for caching, auto-updating, conditional requests, and streams.

## Usage

```javascript
import { useFetch } from "fluth-vue";

const { data, loading, error, promise$ } = useFetch("https://example.com");
```

## Use Cases

`useFetch` handles relationships between asynchronous data, typically in three scenarios:

**_1. Declarative + Reactive Relationship_**

For example, the relationship between `data2` and `data1` below:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com", { refetch: true }).post(payload).json();
const data1 = ref({ a: 1 });
// Usage
const { data: data2 } = useFetchApi(data1);
```

- `data2` and `data1` form a declarative relationship through the `useFetchApi` function, no need to worry about the details of producing `data2`
- `data2` and `data1` form a reactive relationship through the `useFetchApi` function, `data2` will change as `data1` changes

**_2. Declarative Relationship_**

For example, the relationship between `data2` and `data1` below:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2, execute: fetchData2 } = useFetchApi(data1);
```

- `data2` and `data1` form a declarative relationship through the `useFetchApi` function
- Update `data2` actively by calling the `fetchData2` function, which will use the latest `data1` as the request parameter

**_3. Call Relationship_**

For example, the relationship between `data2` and `data1` below:

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Record<string, any>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2 } = await useFetchApi(data1.value);
```

- `data2` is obtained by calling the `useFetchApi` async function and using the current value of `data1` as the request parameter

## Streams

In addition to providing reactive data returns, `useFetch` also supports `fluth` streams. You can get the async data stream through `promise$` and combine it with `fluth` operators to implement complex data stream processing.
