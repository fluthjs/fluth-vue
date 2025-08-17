<script setup>
import Immutable from '../.vitepress/components/immutable.vue'
</script>

# 不可变数据

fluth 底层采用 [limu](https://tnfe.github.io/limu/) 不可变数据，并且只有通过 set、thenSet、thenOnceSet、thenImmediateSet等方法以及 set 操作符才能 immutable 的修改数据。

## 修改对象数据

```typescript
import { $ } from "fluth-vue";

const stream$ = $({ obj: { name: "fluth", age: 0 } });

// 无需使用扩展符{...value, obj: {...value.obj, age: value.obj.age + 1}j}
stream$.set((value) => (value.obj.age += 1));
```

## 修改数组数据

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

## 修改基本数据类型

```typescript
import { $ } from "fluth-vue";

const stream$ = $(1);

// 修改基本数据类型
stream$.next(2);
```

## 应用场景

ref 和 reactive 对象获取每次修改的快照比较困难，但是 fluth 只需要添加打印插件就可以清楚的获知整个修改过程：

::: code-group

```vue [fluth]
<template>
  <button @click="data$.set((value) => value.nest.age++)">
    add age for fluth: {{ data$.ref.value.nest.age }}
  </button>
</template>

<script>
import { $, toComp, consoleNode } from "../../core/useFluth/index";

const data$ = $({ nest: { name: "fluth", age: 0 } }).use(
  consoleNode("fluth value"),
);
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
打开控制台并点击按钮查看效果

<Immutable />
:::
