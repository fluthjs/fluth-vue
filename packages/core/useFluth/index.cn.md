# fluth

fluth 是一个类 promise 的流式编程库。fluth-vue 默认集成 fluth。

具体使用详情见：[fluth](https://fluthjs.github.io/fluth-doc/)

## to$

to$ 是一个用于将 Vue 的响应式数据（ref、reactive、computed）转换为 fluth 的 Stream 的工具函数，转换前 vue 响应式数据会进行 deep clone 后再给到 Stream。

**类型**

```typescript
function to$<T>(arg: Ref<T> | ComputedRef<T> | Reactive<T>): Stream<T>;
```

**示例**

```typescript
import { ref, reactive, computed } from "vue";
import { to$ } from "fluth-vue";

// 转换 ref
const refValue = ref("initial value");
const refStream$ = to$(refValue);

// 转换 reactive 对象
const reactiveObj = reactive({ count: 0, name: "test" });
const reactiveStream$ = to$(reactiveObj);

// 转换 computed
const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const computedStream$ = to$(computedValue);
```

## Stream 和 Observable

fluth-vue 对 fluth 的 Stream 和 Observable 进行了增强，增加了 ref、toCompt 和 render 方法。

**类型**

```typescript
declare module "fluth" {
  interface Stream<T> {
    ref: DeepReadonly<Ref<T>>;
    toCompt: () => ComputedRef<T>;
    render: (
      renderFn?: (value: T) => VNodeChild | DefineComponent,
    ) => DefineComponent;
  }
  interface Observable<T> {
    ref: DeepReadonly<Ref<T | undefined>>;
    toCompt: () => ComputedRef<T | undefined>;
    render: (
      renderFn?: (value: T | undefined) => VNodeChild | DefineComponent,
    ) => DefineComponent;
  }
}
```

### ref

fluth 的 Stream 和 Observable 都增加了 ref 属性，自动将流的数据转换为 ref 对象，ref 属性是 DeepReadonly 类型，即只读的 ref 对象。

::: tip 注意

ref 属性只能在 vue >= 2.7.0 的版本中使用，低于 2.7.0 的版本可以使用 [toCompt](#tocompt) 方法替代。

:::

**直接使用**

```vue
<template>
  <div>{{ stream$.ref.value }}</div>
</template>

<script setup lang="tsx">
import { $ } from "fluth";

const stream$ = $("Hello");
</script>
```

由于 vue 的 template 只会对 setup 的返回值的第一层级的响应式数据进行解构，所以无法直接在 template 中使用 stream$.ref，必须使用 stream$.ref.value 来获取流的值。

**引用使用**

通过将流的 ref 赋值给一个变量，这个变量在 template 中可以直接使用并正确的解构出流的值。

```vue
<template>
  <div>{{ stream$Ref }}</div>
</template>

<script setup>
import { $ } from "fluth";

const stream$ = $("Hello");
const stream$Ref = stream$.ref;
</script>
```

### toCompt

toCompt 方法用于将流的值转换为 computed 对象。

::: tip 注意

- toCompt 不能在 template 中直接使用
- toCompt 在组件的 render 函数中使用的时候，组件的 render 函数必须用 [effect](#effect) 包裹，否则流在组件渲染的副作用不会被清理，造成内存泄漏。

:::

::: info 注意

toCompt 方法对于 vue 没有版本限制。

:::

```vue
<template>
  <div>{{ stream$Compt }}</div>
</template>

<script setup>
import { $ } from "fluth";

const stream$ = $("Hello");
const stream$Compt = stream$.toCompt();
</script>
```

### render

在组件中使用 render 方法会将流的值渲染到新组件中，当流推流时，新组件会自动更新且不会触发组件的 onUpdated 生命周期，推荐在 tsx 中使用：

::: tip 注意

render 在 组件的 render 函数中使用的时候，组件的 render 函数必须用 [effect](#effect) 包裹，否则流在组件渲染的副作用不会被清理，造成内存泄漏。

:::

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    onUpdated(() => {
      console.log("Example 组件更新");
    });

    // use$ 推流后只会触发 userRender 的更新，不会触发组件的 onUpdated 生命周期
    const user$Render = user$.render((v) => (
      <div>
        <div>名字：{v.name}</div>
        <div>年龄：{v.age}</div>
        <div>地址：{v.address}</div>
      </div>
    ));

    // order$ 推流后只会触发 orderRender 的更新，不会触发组件的 onUpdated 生命周期
    const order$Render = order$.render((v) => (
      <div>
        <div>商品：{v.item}</div>
        <div>价格：{v.price}</div>
        <div>数量：{v.count}</div>
      </div>
    ));

    return () => (
      <div>
        <div>用户信息</div>
        {user$Render}
        <div>订单信息</div>
        {order$Render}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          更新用户信息
        </button>
        <button onClick={() => order$.set((v) => (v.count += 1))}>
          更新订单信息
        </button>
      </div>
    );
  },
  {
    name: "Example",
    props: [],
  },
);
```

在 template 中使用 render 方法，则需要将 script 的 lang 设置为 tsx：

```vue
<template>
  <div>
    <div>用户信息</div>
    <div><Component :is="user$Render" /></div>
    <div>订单信息</div>
    <div><Component :is="order$Render" /></div>

    <button @click="user$.set((v) => (v.age += 1))">更新用户信息</button>
    <button @click="order$.set((v) => (v.count += 1))">更新订单信息</button>
  </div>
</template>

<script setup lang="tsx">
import { $, Component } from "fluth";

const user$ = $({ name: "", age: 0, address: "" });
const order$ = $({ item: "", price: 0, count: 0 });

onUpdated(() => {
  console.log("Example 组件更新");
});

// use$ 推流后只会触发 userRender 的更新，不会触发组件的 onUpdated 生命周期
const user$Render = user$.render((v) => (
  <div>
    <div>名字：{v.name}</div>
    <div>年龄：{v.age}</div>
    <div>地址：{v.address}</div>
  </div>
));

// order$ 推流后只会触发 orderRender 的更新，不会触发组件的 onUpdated 生命周期
const order$Render = order$.render((v) => (
  <div>
    <div>商品：{v.item}</div>
    <div>价格：{v.price}</div>
    <div>数量：{v.count}</div>
  </div>
));
</script>
```

## effect

**类型**

```typescript
function effect(render: RenderFunction): () => VNodeChild;
```

effect 方法用于清理流在组件渲染的副作用

::: tip 注意

effect 方法只适用于 vue >= 3.2.0 的版本，对于低于 3.2.0 的版本，不建议在组件的 render 函数中使用 [render](#render)、[toCompt](#toCompt)以及流的所有订阅方法和操作符。

:::

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    onUpdated(() => {
      console.log("Example 组件更新");
    });

    return effect(() => (
      <div>
        <div>用户信息</div>
        {/* use$ 推流后只会触发 render 内容更新，不会触发组件的 onUpdated 生命周期 */}
        {user$.render((v) => (
          <div>
            <div>名字：{v.name}</div>
            <div>年龄：{v.age}</div>
            <div>地址：{v.address}</div>
          </div>
        ))}
        <div>订单信息</div>
        {/* order$ 推流后只会触发 render 内容更新，不会触发组件的 onUpdated 生命周期 */}
        {order$.render((v) => (
          <div>
            <div>商品：{v.item}</div>
            <div>价格：{v.price}</div>
            <div>数量：{v.count}</div>
          </div>
        ))}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          更新用户信息
        </button>
        <button onClick={() => order$.set((v) => (v.count += 1))}>
          更新订单信息
        </button>
      </div>
    );
  },
  {
    name: "Example",
    props: [],
  },
);
```
