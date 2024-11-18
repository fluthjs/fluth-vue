# 推流

## 背景

`useFetch`发起请求后如果需要做逻辑处理，通常做法就是监听 `data` 数据，用数据的响应式来组织异步代码常常导致两个问题：

1. 语义不清，监听数据是没有语义并且丢失逻辑上下文，代码阅读只能全局搜索修改 `data` 的逻辑点来理解
2. 监听多个数据，如果数据有依赖先后关系，会导致时序非常难以控制

采用 [fluth](https://fluthjs.github.io/fluth-doc/cn/guide/introduce.html#%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF) 可以很好的处理异步代码的语义和时序问题，`useFetch`集成了 `fluth` 方案。

## 用法

`useFetch` 返回一个 [Stream](https://fluthjs.github.io/fluth-doc/cn/api/stream.html#stream) 实例 `promise$`，可以通过 `promise$.then` 来订阅最新数据

```ts
const { execute, promise$ } = useFetch(url, { immediate: false });

promise$.then(() => {
  console.log(data.value);
});

await execute(); // 打印一次 data.value 的值

await execute(); // 打印一次 data.value 的值
```
