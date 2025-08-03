# effect$

`effect$` 创建自动清理流订阅的作用域。通过它创建的渲染函数在重新调用时自动清理上次流的订阅，并在组件卸载时清理所有订阅，有效防止内存泄漏。

## 类型

```typescript
function effect$(render: RenderFunction): () => VNodeChild;
```

## 参数

- `render: RenderFunction` - Vue 渲染函数，返回 VNode 或其他可渲染内容

## 核心机制

`effect$` 通过以下机制来管理副作用：

1. **范围管理**：使用 Vue 的 `effectScope` 来创建独立的副作用范围
2. **自动清理**：每次渲染时自动清理上一次渲染流的订阅，防止副作用累积
3. **生命周期绑定**：通过 `onScopeDispose` 与组件生命周期绑定，确保组件卸载时最后一次渲染流的订阅被清理

::: warning 注意

`effect$` 只在 vue@3.2.0 及以上版本支持。
:::

## 基本用法

### vue 单文件

vue 单文件中，请使用 `<script lang="tsx" setup>` 开启 tsx 语法：

```vue
<template>
  <div>
    <Info></Info>
  </div>
</template>

<script lang="tsx" setup>
import { $, effect$, toComp } from "fluth-vue";

const info$ = $({ name: "fluth", age: 18 });

const Info = effect$(() => {
  return (
    <div>
      <div>
        {/* 可以使用 render$ */}
        {render$(
          info$
            .thenImmediate()
            .pipe(debounce(100))
            .then((v) => v.name),
        )}
      </div>
      {/* 可以使用 toComp */}
      <div>{toComp(info$).value.age}</div>
    </div>
  );
});
</script>
```

### vue tsx 文件

在 vue tsx 文件中，采用 effect$ 包裹渲染函数后，流可以正常的订阅并且不会导致内存泄漏：

```tsx
import { defineComponent, SetupContext } from "vue";
import { $, effect$, render$, toComp } from "fluth-vue";

type Props = {};
type Emits = {};
export default defineComponent(
  (props: Props, { emit }: SetupContext<Emits>) => {
    const info$ = $({ name: "fluth", age: 18 });

    return effect$(() => {
      return (
        <div>
          <div>
            {/* 可以使用订阅 */}
            {render$(
              info$
                .thenImmediate()
                .pipe(debounce(100))
                .then((v) => v.name),
            )}
          </div>
          {/* 可以使用 toComp  */}
          <div>{toComp(info$).value.age}</div>
        </div>
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
