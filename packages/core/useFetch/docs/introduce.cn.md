# useFetch

采用原生`fetch`封装的请求器，基于[vueuse/useFetch](https://vueuse.org/core/useFetch/)实现并支持了**缓存**、**更新**、**条件**、**重试**、**防抖**、**节流**、**推流**等全新功能。

## 使用场景

`useFetch`用来处理异步请求数据之间的关系，有如下三种典型使用场景：

**_1. 声明式+响应式场景_**

`useFetch`的`payload`为响应式数据，并开启了`refetch`自动更新，如下示例 data2 和 data1：

```javascript{7}
import { useFetch } from "fluth-vue";
// 定义
const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com", { immediate: true, refresh: true }).post(payload).json();
// 使用
const data1 = ref({ a: 1 });
const { data: data2 } = useFetchApi(data1);
```

- data2 和 data1 通过`useFetchApi`函数形成了一种声明式的关系，使用方无需关心生产 data2 的细节
- data2 和 data1 通过`useFetchApi`函数形成了一种响应式的关系，data2 会随着 data1 的变化自动`fetch`更新

**_2. 声明式场景_**

`useFetch`的`payload`为响应式数据，没有开启`refetch`自动更新，如下示例 data2 和 data1：

```javascript{7}
import { useFetch } from "fluth-vue";
// 定义
const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com").post(payload, { immediate: false, refetch: false }).json();
// 使用
const data1 = ref({ a: 1 });
const { data: data2, execute: fetchData2 } = useFetchApi(data1);
```

- data2 和 data1 通过`useFetchApi`函数形成了一种声明式的关系，使用方无需关心生产 data2 的细节
- 还是需要调用`fetchData2`函数来主动更新 data2，此时会拿最新的 data1 作为请求参数

**_3. 调用关系_**

`useFetch`的`payload`为非响应式式数据，每次使用自行取值，如下示例 data2 和 data1：

```javascript{7}
import { useFetch } from "fluth-vue";
// 定义
const useFetchApi = (payload: Record<string, any>) =>
  useFetch("https://example.com", { immediate: false, refetch: false }).post(payload).json();
// 使用
const data1 = ref({ a: 1 });
const { data: data2 } = await useFetchApi(data1.value);
```

- data2 是通过调用`useFetchApi`异步函数并实时取出当前 data1 的值作为请求参数来获取的
