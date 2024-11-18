# useFetch

A request handler wrapped around the native `fetch`, based on [vueuse/useFetch](https://vueuse.org/core/useFetch/) implementation with additional features including **caching**, **updating**, **conditional requests**, **debouncing**, **throttling**, and **streaming**.

## Use Cases

`useFetch` handles relationships between asynchronous data requests, with three typical use cases:

**_1. Declarative + Reactive Scenario_**

`useFetch` with reactive `payload` and enabled `refetch` auto-update, as shown in the example with data2 and data1:

```javascript{7}
import { useFetch } from "fluth-vue";
// Definition
const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com", { immediate: true, refresh: true }).post(payload).json();
// Usage
const data1 = ref({ a: 1 });
const { data: data2 } = useFetchApi(data1);
```

- data2 and data1 form a declarative relationship through the `useFetchApi` function, where users don't need to worry about the details of producing data2
- data2 and data1 form a reactive relationship through the `useFetchApi` function, where data2 automatically updates via `fetch` when data1 changes

**_2. Declarative Scenario_**

`useFetch` with reactive `payload` but without `refetch` auto-update, as shown in the example with data2 and data1:

```javascript{7}
import { useFetch } from "fluth-vue";
// Definition
const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com").post(payload, { immediate: false, refetch: false }).json();
// Usage
const data1 = ref({ a: 1 });
const { data: data2, execute: fetchData2 } = useFetchApi(data1);
```

- data2 and data1 form a declarative relationship through the `useFetchApi` function, where users don't need to worry about the details of producing data2
- You still need to call the `fetchData2` function to actively update data2, which will use the latest data1 as the request parameter

**_3. Call Relationship_**

`useFetch` with non-reactive `payload`, where values are retrieved manually each time, as shown in the example with data2 and data1:

```javascript{7}
import { useFetch } from "fluth-vue";
// Definition
const useFetchApi = (payload: Record<string, any>) =>
  useFetch("https://example.com", { immediate: false, refetch: false }).post(payload).json();
// Usage
const data1 = ref({ a: 1 });
const { data: data2 } = await useFetchApi(data1.value);
```

- data2 is obtained by calling the `useFetchApi` async function and using the current value of data1 as the request parameter

## Features

- 🚀 Simple and intuitive API
- ⚡️ Automatic request cancellation on component unmount
- 🔄 Loading state management
- ❌ Error handling
- 🎯 TypeScript support
- 📦 Zero dependencies

## Installation
