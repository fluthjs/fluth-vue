<script setup>
import Immutable from '../.vitepress/components/immutable.vue'
</script>

# 进阶

## 不可变数据

`fluth` 底层采用不可变数据，在修改数据时为了后续渲染性能考虑，尽量采用不可变数据。

### 修改对象数据

```typescript
import { $ } from "fluth-vue";

const stream$ = $({ obj: { name: "fluth", age: 0 } });

stream$.set((value) => (value.obj.age += 1)); // 再也不用采用{...value, obj: {...value.obj, age: value.obj.age + 1}j}
```

### 修改数组数据

```typescript
import { $ } from "fluth-vue";

const stream$ = $([1, 2, 3]);

// 修改数组数据
stream$.set((value) => {
  value[0] = 2;
});

// 整体替换
stream$.next([1, 2, 3, 4]);
```

`ref` 和 `reactive` 对象获取每次修改的快照比较困难，但是 `fluth` 只需要添加打印插件就可以清楚的获知整个修改过程：

::: code-group

```vue [fluth]
<template>
  <button @click="data$.set((value) => value.nest.age++)">
    add age for fluth: {{ computedData.nest.age }}
  </button>
</template>

<script>
import { $, toComp, consoleNode } from "../../core/useFluth/index";

const data$ = $({ nest: { name: "fluth", age: 0 } }).use(
  consoleNode("fluth value"),
);
const computedData = toComp(data$);
</script>
```

```vue [ref]
<template>
  <button class="immutable-button" @click="data.nest.age++">
    add age for ref: {{ data.nest.age }}
  </button>
</template>

<script setup lang="tsx">
import { ref, watch } from "vue";

const data = ref({ nest: { name: "fluth", age: 0 } });
watch(
  data,
  (newVal) => {
    console.log("ref value", newVal);
  },
  { deep: true },
);
</script>
```

:::

::: details 效果
可以打开控制台并点击按钮查看效果

<Immutable />

最后结果如下：

| fluth打印结果                                 | ref打印结果                                 |
| --------------------------------------------- | ------------------------------------------- |
| <img src="/fluth-console.png" alt="motion" /> | <img src="/ref-console.png" alt="motion" /> |

:::

::: info 注意
`fluth` 只有通过 `set`、`then$`、`thenOnce$`、`thenImmediate$`等方法才能不可变修改数据
:::

## 开发者工具

`fluth` 提供了一系列强大的开发工具供开发者使用，让使用者可以轻松的对流式数据进行调试。

### 打印插件

`fluth` 提供打印插件，可以打印数据修改过程

单节点打印：

```typescript
import { $, consoleNode } from "fluth";

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
  .then((undefined, value) => ({ current: value }));

data$.next(1);
// 打印 resolve 1
// 打印 reject 2
// 打印 resolve { current: 2 }
```

::: info 注意
`consoleAll` 会打印整条流指的是通过 `then`、`thenOnce`、`thenImmediate`、`then$`、`thenOnce$`、`thenImmediate$`等方法创建的流节点
:::

### 调试插件

`fluth` 提供调试插件，可以调试流式数据

```typescript
import { $, debugNode } from "fluth";

const stream$ = $(0);

stream$.then((value) => value + 1).use(debugNode());

stream$.next(1);
// 在第二个节点触发调试器断点
```

条件调试

```typescript
import { $ } from "fluth";
import { debugAll } from "fluth";

// 只对字符串类型触发调试器
const conditionFn = (value) => typeof value === "string";
const stream$ = $<any>().use(debugNode(conditionFn));

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
