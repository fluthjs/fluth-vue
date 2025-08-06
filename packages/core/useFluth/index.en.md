# fluth

fluth is a Promise-like streaming programming library. fluth-vue includes fluth by default.

For detailed usage, see: [fluth](https://fluthjs.github.io/fluth-doc/)

## to$

to$ is a utility function that converts Vue's reactive data (ref, reactive, computed) into a fluth Stream. Before conversion, Vue reactive data will be deep cloned before being passed to the Stream.

**Type**

```typescript
function to$<T>(arg: Ref<T> | ComputedRef<T> | Reactive<T>): Stream<T>;
```

**Example**

```typescript
import { ref, reactive, computed } from "vue";
import { to$ } from "fluth-vue";

// Convert ref
const refValue = ref("initial value");
const refStream$ = to$(refValue);

// Convert reactive object
const reactiveObj = reactive({ count: 0, name: "test" });
const reactiveStream$ = to$(reactiveObj);

// Convert computed
const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const computedStream$ = to$(computedValue);
```

## Stream and Observable

fluth-vue enhances fluth's Stream and Observable by adding ref, toCompt and render methods.

**Type**

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

fluth's Stream and Observable both have a ref property that automatically converts stream data to ref objects. The ref property is of DeepReadonly type, meaning it's a read-only ref object.

::: tip Note

The ref property can only be used in Vue >= 2.7.0 versions. For versions below 2.7.0, you can use the [toCompt](#tocompt) method as an alternative.

:::

**Direct Usage**

```vue
<template>
  <div>{{ stream$.ref.value }}</div>
</template>

<script setup lang="tsx">
import { $ } from "fluth";

const stream$ = $("Hello");
</script>
```

Since Vue's template only destructures reactive data at the first level of setup's return value, you cannot directly use stream$.ref in the template. You must use stream$.ref.value to get the stream's value.

**Reference Usage**

By assigning the stream's ref to a variable, this variable can be used directly in the template and correctly destructure the stream's value.

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

The toCompt method is used to convert stream values to computed objects.

::: tip Note

- toCompt cannot be used directly in templates
- When using toCompt in a component's render function, the component's render function must be wrapped with [effect](#effect), otherwise the stream's side effects during component rendering won't be cleaned up, causing memory leaks.

:::

::: info Note

The toCompt method has no version restrictions for Vue.

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

Using the render method in a component will render the stream's value to a new component. When the stream pushes data, the new component will automatically update without triggering the component's onUpdated lifecycle. It's recommended to use in tsx:

::: tip Note

When using render in a component's render function, the component's render function must be wrapped with [effect](#effect), otherwise the stream's side effects during component rendering won't be cleaned up, causing memory leaks.

:::

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    onUpdated(() => {
      console.log("Example component updated");
    });

    // After user$ pushes data, only userRender will be updated, won't trigger component's onUpdated lifecycle
    const user$Render = user$.render((v) => (
      <div>
        <div>Name: {v.name}</div>
        <div>Age: {v.age}</div>
        <div>Address: {v.address}</div>
      </div>
    ));

    // After order$ pushes data, only orderRender will be updated, won't trigger component's onUpdated lifecycle
    const order$Render = order$.render((v) => (
      <div>
        <div>Item: {v.item}</div>
        <div>Price: {v.price}</div>
        <div>Count: {v.count}</div>
      </div>
    ));

    return () => (
      <div>
        <div>User Information</div>
        {user$Render}
        <div>Order Information</div>
        {order$Render}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          Update User Information
        </button>
        <button onClick={() => order$.set((v) => (v.count += 1))}>
          Update Order Information
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

When using the render method in template, you need to set the script's lang to tsx:

```vue
<template>
  <div>
    <div>User Information</div>
    <div><Component :is="user$Render" /></div>
    <div>Order Information</div>
    <div><Component :is="order$Render" /></div>

    <button @click="user$.set((v) => (v.age += 1))">
      Update User Information
    </button>
    <button @click="order$.set((v) => (v.count += 1))">
      Update Order Information
    </button>
  </div>
</template>

<script setup lang="tsx">
import { $ } from "fluth-vue";
import { onUpdated } from "vue";

const user$ = $({ name: "", age: 0, address: "" });
const order$ = $({ item: "", price: 0, count: 0 });

onUpdated(() => {
  console.log("Example component updated");
});

// After user$ pushes data, only userRender will be updated, won't trigger component's onUpdated lifecycle
const user$Render = user$.render((v) => (
  <div>
    <div>Name: {v.name}</div>
    <div>Age: {v.age}</div>
    <div>Address: {v.address}</div>
  </div>
));

// After order$ pushes data, only orderRender will be updated, won't trigger component's onUpdated lifecycle
const order$Render = order$.render((v) => (
  <div>
    <div>Item: {v.item}</div>
    <div>Price: {v.price}</div>
    <div>Count: {v.count}</div>
  </div>
));
</script>
```

## effect

**Type**

```typescript
function effect(render: RenderFunction): () => VNodeChild;
```

The effect method is used to clean up stream side effects during component rendering

::: tip Note

The effect method only applies to Vue >= 3.2.0 versions. For versions below 3.2.0, it's not recommended to use [render](#render), [toCompt](#tocompt) and all stream subscription methods and operators in component render functions.

:::

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    onUpdated(() => {
      console.log("Example component updated");
    });

    return effect(() => (
      <div>
        <div>User Information</div>
        {/* After user$ pushes data, only render content will be updated, won't trigger component's onUpdated lifecycle */}
        {user$.render((v) => (
          <div>
            <div>Name: {v.name}</div>
            <div>Age: {v.age}</div>
            <div>Address: {v.address}</div>
          </div>
        ))}
        <div>Order Information</div>
        {/* After order$ pushes data, only render content will be updated, won't trigger component's onUpdated lifecycle */}
        {order$.render((v) => (
          <div>
            <div>Item: {v.item}</div>
            <div>Price: {v.price}</div>
            <div>Count: {v.count}</div>
          </div>
        ))}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          Update User Information
        </button>
        <button onClick={() => order$.set((v) => (v.count += 1))}>
          Update Order Information
        </button>
      </div>
    ));
  },
  {
    name: "Example",
    props: [],
  },
);
```
