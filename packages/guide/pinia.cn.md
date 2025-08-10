# 业务模型抽象

fluth-vue 推荐将业务逻辑全部抽离到逻辑层，并对业务进行建模，由业务模型驱动视图层，视图层只负责消费数据。

在 vue 生态中，逻辑层最好的落地就是 pinia，pinia 是 vue 的官方状态管理库，它提供了强大的状态管理能力，可以满足大部分业务需求。

fluth-vue 完美兼容 pinia，流的数据可以直接在 vue-devtools 的 pinia 面板中直接查看。

在 pinia 中通过模块化的设计理念和 fluth-vue 响应式的编程方式，轻松实现业务层和视图层的解耦。

## 示例

通过一个简单的示例，展示了如何在 pinia 中结合 fluth-vue 的响应式数据来落地业务模型：

### 代码目录

逻辑层统一放置在 store 目录下，useModuleA 和 useModuleB 代表两个业务模块，每个模块的逻辑都以 services 的形式存在

```js
└── store
    ├── index.ts
    │  
    ├── useModuleA
    │   ├── services
    │   │   ├── useServiceA.ts
    │   │   └── useServiceB.ts
    │   │   └── ...
    │   └── index.ts
    │     
    ├── useModuleB
    │   ├── services
    │   │   ├── useServiceC.ts
    │   │   └── useServiceD.ts
    │   │   └── ...
    │   └── index.ts
    └── ...

```

### module 模块

module 模块只做两件事情：

1. 定义 module 之间的依赖关系
2. 定义 service 之间的依赖关系

如果逻辑是一本书，那么 module 模块就是书的章节，service 就是书的章节内容。

```typescript
import { defineStore } from "pinia";
import { reactive } from "vue";
import { $ } from "fluth-vue";
import { useModuleB } from "./useModuleB";

const useModuleAStore = defineStore("moduleA", () => {
  // 定义 module 之间的依赖关系
  const moduleB = useModuleB();

  // 定义 service 之间的依赖关系
  const serviceA = useServiceA(moduleB.serviceC);
  const serviceB = useServiceB(serviceA);

  // 服务必须通过 reactive 包装
  // 这样 vue-devtools 可以在 pinia 中直接查看 service 的响应式数据
  return {
    serviceA: reactive(serviceA),
    serviceB: reactive(serviceB),
  };
});
```

### service 服务

useServiceA 的实现

```typescript
import { useServiceC } from "../../useModuleB/services/useServiceC";
import { recover$, merge } from "fluth-vue";

const useServiceA = (serviceC: ReturnType<typeof useServiceC>) => {
  // 从 reactive 中恢复出流的实例
  const { dataC$ } = recover$(serviceC);

  const dataA$ = $("A");
  const dataB$ = $(1);

  merge(dataA$, dataC$).then((data) => {
    // 详细逻辑
  });

  dataB$.then((dataB) => {
    // 详细逻辑
  });

  return {
    dataA$,
    dataB$,
  };
};
```

useServiceB 的实现

```typescript
// 定义业务服务B
const useServiceB = (serviceA: ReturnType<typeof useServiceA>) => {
  const { dataA$ } = serviceA;

  const dataC$ = $("C");
  const dataD$ = $(3);

  dataC$.then((dataC) => {
    // 详细逻辑
  });

  promiseAll(dataA$, dataD$).then(([dataA, dataD]) => {
    // 详细逻辑
  });

  return {
    dataC$,
    dataD$,
  };
};
```

### 视图层消费

```vue
<template>
  <div>
    <div>{{ dataA$ }}</div>
    <div>{{ dataC$ }}</div>

    <button @click="addDataB">点击</button>
    <button @click="addDataD">点击2</button>
  </div>
</template>

<script setup lang="ts">
import { useModuleAStore } from "@/store";
import { recover$ } from "fluth-vue";

const moduleAStore = useModuleAStore();

// 从 reactive 中恢复出流的实例
const { dataA$, dataB$ } = recover$(moduleAStore.serviceA);
const { dataC$, dataD$ } = recover$(moduleAStore.serviceB);

const addDataB = () => {
  dataB$.next(dataB$.value + 1);
};

const addDataD = () => {
  dataD$.next(dataD$.value + 1);
};
</script>
```
