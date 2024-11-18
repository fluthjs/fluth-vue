# Stream

## Background

When `useFetch` makes a request and needs to handle logic afterwards, the common approach is to watch the `data` value. However, organizing asynchronous code through reactive data often leads to two problems:

1. Unclear semantics - watching data lacks semantic meaning and loses logical context. Code readability requires searching globally for logic points that modify `data` to understand the flow
2. When watching multiple data points that have sequential dependencies, controlling the timing becomes very difficult

Using [fluth](https://fluthjs.github.io/fluth-doc/cn/guide/introduce.html#%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF) can effectively handle the semantics and timing issues of asynchronous code. `useFetch` integrates the `fluth` solution.

## Usage

`useFetch` returns a [Stream](https://fluthjs.github.io/fluth-doc/cn/api/stream.html#stream) instance `promise$`, which allows subscribing to the latest data through `promise$.then`

```ts
const { execute, promise$ } = useFetch(url, { immediate: false });

promise$.then(() => {
  console.log(data.value);
});

await execute(); // Prints data.value once

await execute(); // Prints data.value once
``` 