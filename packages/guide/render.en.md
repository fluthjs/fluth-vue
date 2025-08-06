<script setup>
import streamingRender from "../.vitepress/components/streamingRender.tsx";
import refRender from "../.vitepress/components/refRender.tsx";
import mixRender from "../.vitepress/components/mixRender.tsx";
</script>

# Streaming Rendering

In addition to using stream reactive data for rendering, fluth provides powerful streaming rendering [render](/en/useFluth/#render) functionality that can achieve element-level rendering or block-level rendering, with overall effects similar to signal or block signal rendering.

## Element-level Rendering

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const name$ = $(hello);

    onUpdated(() => {
      console.log("Example component updated");
    });

    return effect(() => (
      <div>
        <div>
          Name: {name$.render()}
        </div>
        <button onClick={() => name$.set((v) => v + " world")}>Update</button>
      </div>
    );
  },
  {
    name: "Example",
    props: [],
  },
);
```

When clicking the update button to update the text, the component's onUpdated lifecycle will not be triggered.

## Block-level Rendering

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const info$ = $({ name: "", age: 0, address: "" });

    onUpdated(() => {
      console.log("Example component updated");
    });

    return effect(() => (
      <div>
        <div>User Information</div>
        {user$.render((v) => (
          <div>
            <div>Name: {v.name}</div>
            <div>Age: {v.age}</div>
            <div>Address: {v.address}</div>
          </div>
        ))}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          Update User Information
        </button>
      </div>
    );
  },
  {
    name: "Example",
  },
);
```

Whether it's user information or order information, after clicking the update button, the component's onUpdated lifecycle will not be triggered.

## Comparison

Comparison between fluth render and ref rendering:

::: code-group

```tsx [fluth render]
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, onUpdated, h } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order$ = $({ item: "", price: 0, count: 0 });

    return effect(() => (
      <div class="card-light">
        <div> example component </div>
        <div>render time: {Date.now()}</div>
        <section style={{ display: "flex", justifyContent: "space-between" }}>
          {/* use$ emit data only trigger render content update*/}
          {user$.render((v) => (
            <div key={Date.now()} class="card">
              <div>user$ render</div>
              <div>name：{v.name}</div>
              <div>age：{v.age}</div>
              <div>address：{v.address}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
          {/* order$ emit data only trigger render content update*/}
          {order$.render((v) => (
            <div key={Date.now()} class="card">
              <div>order$ render</div>
              <div>item：{v.item}</div>
              <div>price：{v.price}</div>
              <div>count：{v.count}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
        </section>

        <div class="operator">
          <button class="button" onClick={() => user$.set((v) => (v.age += 1))}>
            update user$ age
          </button>
          <button
            class="button"
            onClick={() => order$.set((v) => (v.count += 1))}
          >
            update order$ count
          </button>
        </div>
      </div>
    ));
  },
  {
    name: "streamingRender",
  },
);
```

```tsx [ref render]
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, ref, h } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const user = ref({ name: "", age: 0, address: "" });
    const order = ref({ item: "", price: 0, count: 0 });

    return effect(() => (
      <div class="card-light" key={Date.now()}>
        <div> example component </div>
        <div>render time: {Date.now()}</div>
        <section style={{ display: "flex", justifyContent: "space-between" }}>
          <div key={Date.now()} class="card">
            <div>user ref render</div>
            <div>name：{user.value.name}</div>
            <div>age：{user.value.age}</div>
            <div>address：{user.value.address}</div>
            <div>render time: {Date.now()}</div>
          </div>
          <div key={Date.now()} class="card">
            <div>order ref render</div>
            <div>item：{order.value.item}</div>
            <div>price：{order.value.price}</div>
            <div>count：{order.value.count}</div>
            <div>render time: {Date.now()}</div>
          </div>
        </section>

        <div class="operator">
          <button class="button" onClick={() => (user.value.age += 1)}>
            update user age
          </button>
          <button class="button" onClick={() => (order.value.count += 1)}>
            update order count
          </button>
        </div>
      </div>
    ));
  },
  {
    name: "RefRender",
  },
);
```

```tsx [mix render]
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineComponent, ref, h } from "vue";
import { $, effect } from "../../core/useFluth/index";

export default defineComponent(
  () => {
    const user$ = $({ name: "", age: 0, address: "" });
    const order = ref({ item: "", price: 0, count: 0 });

    return effect(() => (
      <div class="card-light" key={Date.now()}>
        <div> example component </div>
        <div>render time: {Date.now()}</div>
        <section style={{ display: "flex", justifyContent: "space-between" }}>
          {/* use$ emit data only trigger render content update*/}
          {user$.render((v) => (
            <div key={Date.now()} class="card">
              <div>user$ render</div>
              <div>name：{v.name}</div>
              <div>age：{v.age}</div>
              <div>address：{v.address}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
          <div key={Date.now()} class="card">
            <div>order ref render</div>
            <div>item：{order.value.item}</div>
            <div>price：{order.value.price}</div>
            <div>count：{order.value.count}</div>
            <div>render time: {Date.now()}</div>
          </div>
        </section>

        <div class="operator">
          <button class="button" onClick={() => user$.set((v) => (v.age += 1))}>
            update user$ age
          </button>
          <button class="button" onClick={() => (order.value.count += 1)}>
            update order count
          </button>
        </div>
      </div>
    ));
  },
  {
    name: "MixRender",
  },
);
```

:::

### Streaming Rendering Effect

<streamingRender />

### Ref Rendering Effect

<refRender />

### Streaming + Ref Mixed Rendering Effect

<mixRender />
