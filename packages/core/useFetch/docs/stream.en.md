# Streaming

## Background

When `useFetch` makes a request and requires logic processing, the usual approach is to watch the `data`. Using data reactivity to organize asynchronous code often leads to two problems:

1. Unclear semantics: watching data has no semantic meaning and loses logical context. Code reading requires global searching for logic points that modify `data` to understand
2. Watching multiple data: if data has dependency relationships, timing becomes very difficult to control

Using [fluth](https://fluthjs.github.io/fluth-doc/cn/guide/introduce.html#%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF) can handle the semantic and timing issues of asynchronous code very well. `useFetch` integrates the `fluth` solution.

## Usage

`useFetch` returns a [Stream](https://fluthjs.github.io/fluth-doc/cn/api/stream.html#stream) instance `promise$`. You can subscribe to the latest data through `promise$.then`

```ts
const { execute, promise$ } = useFetch(url, { immediate: false });

promise$.then(() => {
  console.log(data.value);
});

await execute(); // Prints data.value once

await execute(); // Prints data.value once
```