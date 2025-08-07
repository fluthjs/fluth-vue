<script setup>
import streamingRender from "../.vitepress/components/streamingRender.tsx";
import refRender from "../.vitepress/components/refRender.tsx";
import mixRender from "../.vitepress/components/mixRender.tsx";
</script>

# 流式渲染

除了利用流的响应式数据来做渲染，fluth 提供了强大的流式渲染 [render$](/cn/useFluth/#render) 功能，可以实现元素级渲染或者块级渲染，整体效果类似 signal 或者 block signal 的渲染。

## 元素级渲染

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const name$ = $("hello");

    onUpdated(() => {
      console.log("Example 组件更新");
    });

    return effect(() => (
      <div>
        <div>
          名字：{name$.render$()}
        </div>
        <button onClick={() => name$.set((v) => v + " world")}>更新</button>
      </div>
    );
  },
  {
    name: "Example",
  },
);
```

点击更新按钮更新文案的时候，不会触发组件的 onUpdated 生命周期。

## 块级渲染

```tsx
import { defineComponent, onUpdated } from "vue";
import { $, effect } from "fluth-vue";

export default defineComponent(
  () => {
    const info$ = $({ name: "", age: 0, address: "" });

    onUpdated(() => {
      console.log("Example 组件更新");
    });

    return effect(() => (
      <div>
        <div>用户信息</div>
        {user$.render$((v) => (
          <div>
            <div>名字：{v.name}</div>
            <div>年龄：{v.age}</div>
            <div>地址：{v.address}</div>
          </div>
        ))}

        <button onClick={() => user$.set((v) => (v.age += 1))}>
          更新用户信息
        </button>
      </div>
    );
  },
  {
    name: "Example",
  },
);
```

点击更新按钮后，只会触发 user$.render$ 内部的重新渲染，不会触发组件的 onUpdated 生命周期。

## 对比

采用 fluth render$ 和 ref 渲染的对比：

::: code-group

```tsx [fluth render$]
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
          {user$.render$((v) => (
            <div key={Date.now()} class="card">
              <div>user$ render</div>
              <div>name：{v.name}</div>
              <div>age：{v.age}</div>
              <div>address：{v.address}</div>
              <div>render time: {Date.now()}</div>
            </div>
          ))}
          {/* order$ emit data only trigger render content update*/}
          {order$.render$((v) => (
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
          {user$.render$((v) => (
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

### 流式渲染效果

<streamingRender />

### ref 渲染效果

<refRender />

### 流式 + ref 混合渲染效果

<mixRender />
