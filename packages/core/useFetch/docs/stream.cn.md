# 数据流 (Stream)

## 类型定义

```typescript
// useFetch 返回值中的 promise$
promise$: Stream<T | undefined, true>;
```

## 背景

useFetch 在执行请求后，除了提供响应式的 data 数据外，还提供了基于 [fluth](https://fluthjs.github.io/fluth-doc/) 的数据流 promise$。通过 promise$ 可以订阅每次请求的结果，实现更灵活的异步数据处理。

## 基础用法

### 订阅请求结果

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

// 订阅成功结果
promise$.then((data) => {
  console.log("请求成功:", data);
});

// 订阅错误结果
promise$.catch((error) => {
  console.log("请求失败:", error);
});

execute(); // 触发请求，promise$ 会推送结果
```

### 处理成功和失败

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

promise$
  .then((data) => {
    console.log("成功:", data);
  })
  .catch((error) => {
    console.log("失败:", error);
  });

await execute(); // 正常响应，promise$ 推送成功结果
```

## 核心特性

### 每次请求都会推送

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
});

const results: any[] = [];
promise$.then((data) => {
  results.push(data);
});

await execute(); // 第一次请求
await execute(); // 第二次请求
await execute(); // 第三次请求

console.log(results.length); // 3 - 每次 execute 都会推送结果
```

### 缓存命中时也会推送

```ts
const { execute, promise$ } = useFetch("https://api.example.com/data", {
  immediate: false,
  cacheSetting: {
    cacheResolve: ({ url }) => url,
  },
});

const streamData: any[] = [];
promise$.then((data) => {
  streamData.push(data);
});

await execute(); // 第一次请求，从服务器获取
await execute(); // 缓存命中，promise$ 仍然会推送缓存数据

console.log(streamData.length); // 2 - 缓存命中时也推送
```

### 错误处理

```ts
const { execute, promise$ } = useFetch("https://api.example.com/error", {
  immediate: false,
});

promise$
  .then((data) => {
    console.log("成功:", data);
  })
  .catch((error) => {
    console.log("错误:", error); // 4xx/5xx 错误会被推送到 catch
  });

try {
  await execute(); // 如果返回 400/500 等错误
} catch (error) {
  // execute 本身也会抛出错误
}
```

## 与响应式数据的区别

### 响应式数据 (data)

```ts
const { data, execute } = useFetch("https://api.example.com/user", {
  immediate: false,
});

// 监听 data 变化
watch(data, (newData, oldData) => {
  console.log("数据更新:", newData);
});

await execute(); // data.value 更新，触发 watch
```

### 数据流 (promise$)

借助[fluth](https://fluthjs.github.io/fluth-doc/) 提供的强大操作符，可以以非常简单的方式来实现复杂的数据处理。

```ts
import { promiseAll, map } from "fluth-vue";

const { promise$: stream1 } = useFetch("/api/data1");
const { promise$: stream2 } = useFetch("/api/data2");

// 合并多个数据流
const all$ = promiseAll(stream1, stream2);
```
