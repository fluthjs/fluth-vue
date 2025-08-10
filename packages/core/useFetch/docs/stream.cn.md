# 数据流 (Stream)

## 类型定义

```typescript
// useFetch 返回值中的 promise$
promise$: Stream<T | undefined>;
```

## 背景

useFetch 在执行请求后，除了提供响应式的 data 数据外，还提供了基于 [fluth](https://fluthjs.github.io/fluth-doc/) 的数据流 promise$。通过 promise$ 可以订阅每次请求的结果，实现更灵活的异步数据处理。

## 用法

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

### 流输入输出

异步请求方法用 useFetch 封装，流作为输入输出，可以实现流式编程。

```ts
const url$ = $("https://api.example.com/data");
const payload$ = $({ id: 1, name: "fluth" });
const { promise$ } = useFetch(url$, { immediate: false, refetch: true })
  .get(payload$)
  .json();

promise$.then((data) => {
  console.log(data);
});

url$.next("https://api.example.com/data2"); // 触发请求，并打印结果
payload$.next({ id: 2, name: "vue" }); // 触发请求，并打印结果
```
