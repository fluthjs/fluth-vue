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
  interface Stream<T> extends Readonly<Ref<T>> {
    toCompt: () => ComputedRef<T>;
    render: (
      renderFn?: (value: T) => VNodeChild | DefineComponent,
    ) => VNodeChild;
  }
  interface Observable<T> extends Readonly<Ref<T | undefined>> {
    toCompt: () => ComputedRef<T | undefined>;
    render: (
      renderFn?: (value: T | undefined) => VNodeChild | DefineComponent,
    ) => VNodeChild;
  }
}
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
import { $ } from "fluth-vue";

const stream$ = $("Hello");
const stream$Compt = stream$.toCompt();
</script>
```

### render

在组件中使用 render 方法会将流的值渲染到新组件中，当流推流时，新组件会自动更新且不会触发组件的 onUpdated 生命周期，推荐在 tsx 中使用：

::: tip 注意

render 在 组件的 render 函数中使用的时候，组件的 render 函数必须用 [effect](#effect) 包裹，否则流在组件渲染的副作用不会被清理，造成内存泄漏。

:::

在 setup 中使用定义流的 render 方法，可以直接放入组件的 render 函数中

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

想在 template 中使用流的 render 能力，则需要将 script 的 lang 设置为 tsx，并在 setup 中设置定义好流的 render 方法，最后通过 `<Component :is="" />` 来渲染流。

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
import { $ } from "fluth-vue";
import { onUpdated } from "vue";

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
  },
);
```
