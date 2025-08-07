<script setup>
import Console from "../.vitepress/components/console.vue";
</script>

# 调试

fluth 提供了一系列强大的开发工具供开发者使用，让使用者可以轻松的对流式数据进行调试。

## 打印插件

fluth 提供打印插件，可以打印数据修改过程

单节点打印：

```typescript
import { $, consoleNode } from "fluth-vue";

const data$ = $().use(consoleNode());

data$.next(1); // 打印 resolve 1
data$.next(2); // 打印 resolve 2
data$.next(3); // 打印 resolve 3

data$.next(Promise.reject(4)); // 打印 reject 4
```

整条流打印：

```typescript
import { $, consoleAll } from "fluth";

const data$ = $().use(consoleAll());
data$
  .then((value) => Promise.reject(value + 1))
  .then((undefined, (value) => ({ current: value })));

data$.next(1);
// 打印 resolve 1
// 打印 reject 2
// 打印 resolve { current: 2 }
```

::: code-group

```vue [fluth]
<template>
  <div>
    <button class="immutable-button" @click="updateData$">data$ + 1</button>
  </div>
</template>

<script setup lang="tsx">
import { $, consoleAll, debounce } from "../../core/useFluth/index";

const data$ = $().use(consoleAll());
data$
  .pipe(debounce(300))
  .then((value) => {
    throw new Error(String(value + 1));
  })
  .then(undefined, (value) => ({ current: value }));

const updateData$ = () => {
  data$.next(1);
};
</script>
```

:::

::: details 效果
可以打开控制台并点击按钮查看效果

<Console />
:::

::: info 注意
consoleAll 会打印整条流指的是通过 then、thenOnce、thenImmediate、then$、thenOnce$、thenImmediate$等方法创建的子节点
:::

## 调试插件

:::warning 注意
浏览器可能会过滤 node_modules 中的 debugger 语句，导致调试器断点不生效。需要手动在浏览器开发者工具->setting->ignore list 中添加开启 node_modules 的调试
:::

fluth 提供调试插件，可以调试流式数据

```typescript
import { $, debugNode } from "fluth";

const stream$ = $(0);

stream$.then((value) => value + 1).use(debugNode());

stream$.next(1);
// 触发调试器断点
```

条件调试

```typescript
import { $ } from "fluth";
import { debugAll } from "fluth";

// 只对字符串类型触发调试器
const conditionFn = (value) => typeof value === "string";
const stream$ = $().use(debugNode(conditionFn));

stream$.next("hello"); // 触发调试器
stream$.next(42); // 不触发调试器
```

整条流调试：

```typescript
import { $, debugAll } from "fluth";

const stream$ = $().use(debugAll());

stream$.then((value) => value + 1);

stream$.next(1);
// 在浏览器开发者工具中会在每个节点触发调试器断点，由于当前只有两个节点，所以会触发两次断点
```
