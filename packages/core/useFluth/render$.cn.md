# render$ 指令

`render$` 是一个Vue指令，用于将 Stream 或 Observable 的值动态渲染到DOM元素的文本内容中。
::: info 注意
采用指令渲染流不会引起组件的更新，只会触发元素的更新，类似于[signals](https://github.com/tc39/proposal-signals)
:::

## 语法

```vue
<div v-render$="stream$"></div>
```

## 示例

### Stream

```vue
<template>
  <div>
    <div v-render$="message$"></div>
    <button @click="updateMessage">更新消息</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const vRender$ = render$;

const message$ = $("Hello World");

const updateMessage = () => {
  message$.next("消息已更新！");
};
</script>
```

### Observable

```vue
<template>
  <div>
    <div v-render$="processedData$"></div>
    <button @click="updateData">更新数据</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const vRender$ = render$;

const rawData$ = $("原始数据");
const processedData$ = rawData$.then((data) => `处理后的: ${data}`);

const updateData = () => {
  rawData$.next("新数据");
};
</script>
```

### 链式操作

```vue
<template>
  <!-- ✅ Good performance, only object$.value.attr.name change will trigger re-render -->
  <div v-render$="object$.pipe(get((v) => v.attr.name))"></div>

  <!-- ❌ bad performance, object$ change will trigger re-render, but attr name change will not -->
  <div v-render$="object$.then((v) => v.attr.name)"></div>
</template>

<script setup>
import { $, get, render$ } from "fluth-vue";

const vRender$ = render$;

const object$ = $({ id: 1, attr: { name: "fluth", age: 18 } });
</script>
```
