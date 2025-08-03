# render$ 函数

`render$` 是一个用于将 Stream 或 Observable 的值动态渲染到组件中的函数。

## 类型

```typescript
function render$<T>(
  arg$: Stream<T> | Observable<T>,
  render?: (value: T) => VNodeChild | DefineComponent,
): DefineComponent;
```

## 参数

- `arg$`: Stream 或 Observable 实例
- `render` (可选): 自定义渲染函数，接收 stream 值并返回 VNode 或组件

## 详情

- **render$ 不会触发当前组件的更新**
- 当 render 参数不提供的时候，arg$ 推送数据后会将数据直接渲染到当前组件的 DOM 中
- 当 render 参数提供的时候，arg$ 推送数据后会调用 render 函数，并将返回的 VNode 或组件渲染到当前组件中

## 基本用法

### 不提供渲染函数

如果不提供渲染函数，`render$` 会将 stream 的值直接转换为文本显示，并且不触发组件的 onUpdated 生命周期：

```vue
<template>
  <div>
    <div>{{ render$(message$) }}</div>
    <button @click="updateMessage">更新消息</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const message$ = $("Hello");

const updateMessage = () => {
  message$.next("World");
};

onUpdated(() => {
  console.log("component updated");
});
</script>
```

### 提供渲染函数

提供渲染函数来自定义显示内容，并且不会触发组件的 onUpdated 生命周期：

```vue
<template>
  <div>
    <div>{{ render$(count$, countBlock) }}</div>
    <button @click="updateCount">增加计数</button>
  </div>
</template>

<script lang="tsx" setup>
import { $, render$ } from "fluth-vue";
import { h } from "vue";

const count$ = $(0);

const countBlock = (value: number) => {
  return (
    <div>
      <div>计数: </div>
      <div>{value}</div>
    </div>
  );
};

const updateCount = () => {
  count$.next(count$.value + 1);
};

onUpdated(() => {
  console.log("component updated");
});
</script>
```

## 注意事项!!!

### vue 单文件

当在 vue 单文件组件的 `<template>` 中调用 `render$` 时，不要对第一个流参数进行订阅，否则会导致内存泄漏：

```vue
<template>
  <div>
    <!-- ✅ 正确使用 -->
    <div>{{ render$(name$) }}</div>
    <!-- ❌ 不要对第一个流参数进行订阅 -->
    <div>{{ render$(info$.then((v) => v.name)) }}</div>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const info$ = $({ name: "fluth", age: 18 });

const name$ = info$.then((v) => v.name);
</script>
```

只有在 setup 中流的订阅会随着组件的销毁而自动取消订阅，在 `<template>` 中流的订阅不会自动取消订阅。

### vue tsx 文件

在 vue tsx 文件中，采用 effect$ 包裹渲染函数后，流可以正常的订阅并且不会导致内存泄漏：

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
        <div>
          {render$(
            info$
              .thenImmediate()
              .pipe(debounce(100))
              .then((v) => v.name),
          )}
        </div> //✅ 正确
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
