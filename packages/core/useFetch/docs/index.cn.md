---
sidebarDepth: 2
---

# useFetch

基于[vueuse/useFetch](https://vueuse.org/core/useFetch/)，并支持了缓存、自动更新、条件请求、流等新功能

## 使用方式

```javascript
import { useFetch } from "fluth-vue";

const { data, loading, error, promise$ } = useFetch("https://example.com");
```

## 使用场景

`useFetch`用来处理异步数据之间的关系，一般有如下三种使用场景：

**_1. 声明式+响应式关系_**

比如下面示例`data2`和`data1`：

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com", { refetch: true }).post(payload).json();
const data1 = ref({ a: 1 });
// 使用
const { data: data2 } = useFetchApi(data1);
```

- `data2`和`data1`通过`useFetchApi`函数形成了一种声明式的关系，无需关心生产`data2`的细节
- `data2`和`data1`通过`useFetchApi`函数形成了一种响应式的关系，`data2`会随着`data1`的变化而变化

**_2. 声明式关系_**

比如下面示例`data2`和`data1`：

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Ref<Record<string, any>>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2, execute: fetchData2 } = useFetchApi(data1);
```

- `data2`和`data1`通过`useFetchApi`函数形成了一种声明式的关系
- 通过调用`fetchData2`函数来主动更新`data2`，此时会拿最新的`data1`作为请求参数

**_3. 调用关系_**

比如下面示例`data2`和`data1`：

```javascript{7}
import { useFetch } from "fluth-vue";

const useFetchApi = (payload: Record<string, any>) =>
  useFetch("https://example.com").post(payload).json();

const data1 = ref({ a: 1 });
const { data: data2 } = await useFetchApi(data1.value);
```

- `data2`是通过调用`useFetchApi`异步函数并实时取出当前`data1`的值作为请求参数来获取的

## 流

`useFetch`除了提供响应式的数据返回，还提供了`fluth`流的支持，可以通过`promise$`获取到异步数据流，可以结合`fluth`操作符来实现复杂的数据流处理
