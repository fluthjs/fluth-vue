# 流式渲染

Fluth 提供了强大的流式渲染功能，通过 `render()` 方法可以将 Stream 的值直接渲染为 Vue 组件。这个功能支持自定义渲染函数、自动更新、错误处理和安全防护。

## 基础功能

### 默认渲染

当不提供自定义渲染函数时，Stream 的值会被渲染为纯文本：

```vue
<template>
  <div>
    <component :is="streamComponent" />
  </div>
</template>

<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

const streamComponent = stream$.render();
</script>
```

渲染结果：`Hello World`

### 自定义渲染函数

你可以提供自定义的渲染函数来控制如何渲染 Stream 的值：

```vue
<template>
  <div>
    <component :is="streamComponent" />
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) =>
  h("div", { class: "custom-vnode" }, `VNode: ${value}`),
);
</script>
```

渲染结果：

```html
<div class="custom-vnode">VNode: Hello World</div>
```

### 动态更新

Stream 的值变化时，渲染的组件会自动更新：

```vue
<template>
  <div>
    <component :is="streamComponent" />
    <button @click="updateValue">更新值</button>
  </div>
</template>

<script setup>
import { $ } from "fluth";

const stream$ = $("初始值");

const streamComponent = stream$.render();

const updateValue = () => {
  stream$.next("更新后的值");
};
</script>
```

## 组件渲染

### 返回 Vue 组件

渲染函数可以返回一个完整的 Vue 组件：

```vue
<template>
  <div>
    <component :is="streamComponent" />
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { defineComponent, h } from "vue";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) =>
  defineComponent({
    setup() {
      return () =>
        h("div", { class: "define-component" }, `Component: ${value}`);
    },
  }),
);
</script>
```

### 函数组件

渲染函数也可以返回函数组件：

```vue
<template>
  <div>
    <component :is="streamComponent" />
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) => {
  // 返回函数组件
  const FunctionComponent = () =>
    h("div", { class: "function-component" }, value);
  return FunctionComponent as any;
});
</script>
```

### Options API 组件

支持返回 Options API 风格的组件：

```vue
<template>
  <div>
    <component :is="streamComponent" />
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { defineComponent } from "vue";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) =>
  defineComponent({
    template: '<div class="options-component">{{ message }}</div>',
    data() {
      return { message: value };
    },
  }),
);
</script>
```

## 数据类型支持

### 数字类型

```vue
<script setup>
import { $ } from "fluth";

const numberStream$ = $(42);
const streamComponent = numberStream$.render();
</script>
```

渲染结果：`42`

### 布尔类型

```vue
<script setup>
import { $ } from "fluth";

const booleanStream$ = $(true);
const streamComponent = booleanStream$.render();
</script>
```

渲染结果：`true`

### 数组类型

```vue
<script setup>
import { $ } from "fluth";

const arrayStream$ = $([1, 2, 3]);
const streamComponent = arrayStream$.render();
</script>
```

渲染结果：`1,2,3`

### 对象类型

```vue
<script setup>
import { $ } from "fluth";

const objectStream$ = $({ name: "test", count: 1 });
const streamComponent = objectStream$.render();
</script>
```

渲染结果：`[object Object]`

## 边缘情况处理

### null 和 undefined 值

Stream 会自动处理 null 和 undefined 值：

```vue
<script setup>
import { $ } from "fluth";

const stream$ = ($ < string) | (null > "Initial");

// 更新为 null
stream$.next(null);
// 渲染结果：空字符串 ""
</script>
```

### 没有初始值的 Observable

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $<string>();

// 没有初始值，渲染结果为空字符串
const streamComponent = stream$.render();
</script>
```

### 渲染函数返回 null/undefined

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

// 渲染函数返回 null
const streamComponent = stream$.render(() => null as any);
// 渲染结果：空字符串 ""
</script>
```

## 错误处理

### 渲染函数抛出错误

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

const streamComponent = stream$.render(() => {
  throw new Error("Render function error");
});
// 错误会被捕获，渲染空字符串
</script>
```

### 无效的 VNode 对象

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

// 返回无效的 VNode 对象
const streamComponent = stream$.render(() => ({ invalid: "vnode" }) as any);
// 不会崩溃，会优雅地处理
</script>
```

## 安全性

### XSS 防护

默认渲染会安全地处理 HTML 内容：

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $('<script>alert("xss")</script>');
const streamComponent = stream$.render();
// 渲染结果：<script>alert("xss")</script> (作为纯文本)
</script>
```

### 安全的 HTML 渲染

如果需要渲染 HTML 内容，可以使用自定义渲染函数：

```vue
<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream$ = $("<strong>Bold Text</strong>");

const streamComponent = stream$.render((value) =>
  h("div", {
    class: "safe-html",
    innerHTML: value,
  }),
);
</script>
```

### 文本内容安全

使用 textContent 确保内容安全：

```vue
<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream$ = $('<img src="x" onerror="alert(1)">');

const streamComponent = stream$.render((value) =>
  h("div", { class: "text-only" }, value),
);
// 渲染为纯文本，不会执行 JavaScript
</script>
```

## 性能优化

### 快速更新处理

Stream 能够高效处理快速连续更新：

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Initial");

const streamComponent = stream$.render();

// 快速连续更新
for (let i = 0; i < 100; i++) {
  stream$.next(`Value ${i}`);
}
// 最终渲染结果：Value 99
</script>
```

### 多流实例

多个 Stream 可以独立渲染，互不干扰：

```vue
<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream1$ = $("Stream 1");
const stream2$ = $("Stream 2");

const component1 = stream1$.render();
const component2 = stream2$.render();

// 在模板中使用
// <component :is="component1" />
// <component :is="component2" />
</script>
```

## 与 Observable 链集成

### 转换链

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $(1);
const transformed$ = stream$
  .then((value) => value * 2)
  .then((value) => `Result: ${value}`);

const streamComponent = transformed$.render();

// 触发转换链
stream$.next(5);
// 渲染结果：Result: 10
</script>
```

### 错误处理

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $(1);
const errorObservable$ = stream$.then((value) => {
  if (value > 5) throw new Error("Value too large");
  return value;
});

const streamComponent = errorObservable$.render();

// 不会抛出错误，会优雅地处理
stream$.next(10);
</script>
```

## 组件检测算法

Fluth 使用智能的组件检测算法来区分 Vue 组件和普通对象：

### 函数组件检测

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) => {
  // 返回函数组件
  return () => h("div", { class: "function-component" }, value);
});
</script>
```

### 组件属性检测

Fluth 会检查对象是否具有以下组件属性：

- `setup` 函数
- `render` 函数
- `template` 字符串

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) =>
  defineComponent({
    setup() {
      return () => h("div", `Setup: ${value}`);
    },
  }),
);
</script>
```

### 避免误判

Fluth 不会将普通对象误判为组件：

```vue
<script setup>
import { $ } from "fluth";
import { h } from "vue";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) =>
  h("div", { class: "plain-object" }, JSON.stringify({ name: value })),
);
// 渲染为普通 div，不会被误判为组件
</script>
```

## 最佳实践

### 1. 使用类型安全

```vue
<script setup>
import { $ } from "fluth";

// 明确指定类型
const stream$ = $<string>("Hello");
const streamComponent = stream$.render((value: string) =>
  h("div", value.toUpperCase())
);
</script>
```

### 2. 错误边界

```vue
<script setup>
import { $ } from "fluth";

const stream$ = $("Hello World");

const streamComponent = stream$.render((value) => {
  try {
    return h("div", value);
  } catch (error) {
    console.error("Render error:", error);
    return h("div", "Error occurred");
  }
});
</script>
```

### 3. 性能考虑

```vue
<script setup>
import { $ } from "fluth";
import { computed } from "vue";

const stream$ = $("Hello World");

// 对于复杂计算，使用 computed
const processedValue = computed(() => {
  const value = stream$.ref.value;
  return value.toUpperCase();
});

const streamComponent = stream$.render((value) =>
  h("div", processedValue.value),
);
</script>
```

## 总结

Fluth 的流式渲染功能提供了：

1. **灵活渲染**: 支持默认文本渲染和自定义渲染函数
2. **组件支持**: 可以渲染 Vue 组件、函数组件等
3. **类型安全**: 支持各种数据类型的渲染
4. **错误处理**: 优雅处理渲染错误和异常情况
5. **安全防护**: 内置 XSS 防护和安全内容渲染
6. **性能优化**: 高效处理快速更新和多流实例
7. **智能检测**: 准确的组件检测算法

这些功能让 Fluth 能够提供强大而安全的流式渲染能力，满足各种复杂的渲染需求。
