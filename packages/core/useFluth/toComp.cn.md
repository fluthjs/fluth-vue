# toComp

`toComp` 是一个用于将 `fluth` 的 `Stream` 或 `Observable` 转换为`Vue`的 `ComputedRef` 的工具函数。

::: warning 注意
如果在`Vue`组件中使用 `toComp`，需要在组件的 `setup` 函数中使用 `toComp`，以便在组件销毁时自动取消订阅，如果在`template`中使用 `toComp`，可能会有内存泄漏的风险
:::

## 类型定义

```typescript
// 对于有初始值的 Stream
function toComp<T>(arg: Stream<T, true>): ComputedRef<T>;

// 对于没有初始值的 Stream 或 Observable
function toComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
```

## 基本用法

```vue
<template>
  <div>
    <div>{{ computedStream }}</div>
    <button @click="stream$.next('新值')">更新流</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const stream$ = $("初始值");
const computedStream = toComp(stream$);
</script>
```

## 注意事项!!!

### vue 单文件

请不要在在 vue 单文件组件的 `<template>` 中使用 toComp，否则会导致内存泄漏：

```vue
<template>
  <div>
    <!-- ✅ 正确使用 -->
    <div>{{ computedInfo }}</div>
    <!-- ❌ 不要在 template 中使用 toComp -->
    <div>{{ toComp(info$) }}</div>
  </div>
</template>

<script setup>
import { $, toComp } from "fluth-vue";

const info$ = $({ name: "fluth", age: 18 });
const computedInfo = toComp(info$);
</script>
```

toComp 对流进行了订阅，只有在 setup 中使用 toComp 时，流会自动取消订阅，在 `<template>` 中使用 toComp 时，流不会自动取消订阅。

### vue tsx 文件

在 vue tsx 文件中，采用 effect$ 包裹渲染函数后，可以正常的使用 toComp 而不会导致内存泄漏：

```tsx
import { defineComponent, SetupContext } from "vue";
import { $, effect$, render$ } from "fluth-vue";

type Props = {};
type Emits = {};
export default defineComponent(
  (props: Props, { emit }: SetupContext<Emits>) => {
    const info$ = $({ name: "fluth", age: 18 });

    return effect$(() => {
      return (
        <div>{toComp(info$).value.name}</div> //✅ 正确
      );
    });
  },
  {
    name: "",
    props: [],
    emits: [],
  },
);
```
