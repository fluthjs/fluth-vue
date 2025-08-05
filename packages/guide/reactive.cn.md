# 响应式

Fluth 提供了强大的响应式功能，让 Stream 能够与 Vue 的响应式系统无缝集成。通过 `ref` 属性，Stream 可以触发 Vue 模板的动态渲染、computed 的重新计算以及 watch 的回调执行。

## 模板渲染

Stream 的 `ref` 属性可以直接在 Vue 模板中使用，当调用 `next()` 方法时，模板会自动重新渲染。

### 基础用法

```vue
<template>
  <div>
    <h1>Stream 动态渲染测试</h1>
    <div>当前值: {{ dataStream$.ref.value }}</div>
    <div>类型: {{ typeof dataStream$.ref.value }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";

const dataStream$ = $("初始值");

// 更新流的值，模板会自动重新渲染
dataStream$.next("更新值 1");
dataStream$.next("更新值 2");
dataStream$.next(42); // 支持不同数据类型
</script>
```

### 使用 ref 属性

你也可以直接使用 Stream 的 `ref` 属性：

```vue
<template>
  <div>
    <h1>Stream 动态渲染测试</h1>
    <div>当前值: {{ dataStream$Ref }}</div>
    <div>类型: {{ typeof dataStream$Ref }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";

const dataStream$ = $("初始值");
const dataStream$Ref = dataStream$.ref;

// 更新流的值，模板会自动重新渲染
dataStream$.next("更新值 1");
dataStream$.next("更新值 2");
</script>
```

### 复杂对象渲染

Stream 支持复杂对象的响应式渲染：

```vue
<template>
  <div>
    <div>姓名: {{ userStream$.ref.value.name }}</div>
    <div>年龄: {{ userStream$.ref.value.age }}</div>
    <div>邮箱: {{ userStream$.ref.value.email }}</div>
    <div>完整信息: {{ JSON.stringify(userStream$.ref.value) }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";

const userStream$ = $({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
});

// 更新用户对象
userStream$.next({
  name: "李四",
  age: 30,
  email: "lisi@example.com",
});
</script>
```

### 多流独立渲染

多个 Stream 可以独立渲染，互不影响：

```vue
<template>
  <div>
    <div>流1: {{ stream1$.ref.value }}</div>
    <div>流2: {{ stream2$.ref.value }}</div>
    <div>组合: {{ stream1$.ref.value }} & {{ stream2$.ref.value }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";

const stream1$ = $("流1");
const stream2$ = $("流2");

// 只更新第一个流
stream1$.next("更新的流1");

// 只更新第二个流
stream2$.next("更新的流2");

// 同时更新两个流
stream1$.next("最终流1");
stream2$.next("最终流2");
</script>
```

## 与 Computed 集成

Stream 可以与 Vue 的 `computed` 无缝集成，当 Stream 的值发生变化时，computed 会自动重新计算。

### 基础 Computed

```vue
<template>
  <div>
    <div>原始值: {{ numberStream$.ref.value }}</div>
    <div>计算值: {{ computedValue }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { computed } from "vue";

const numberStream$ = $(10);

const computedValue = computed(() => {
  return numberStream$.ref.value * 2; // 直接使用 stream.value
});

// 更新流的值，computed 会自动重新计算
numberStream$.next(15); // computedValue 变为 30
numberStream$.next(25); // computedValue 变为 50
</script>
```

### 复杂 Computed 计算

多个 Stream 可以参与复杂的 computed 计算：

```vue
<template>
  <div>
    <div>价格: {{ priceStream$.ref.value }}</div>
    <div>数量: {{ quantityStream$.ref.value }}</div>
    <div>折扣: {{ discountPercentage }}%</div>
    <div>小计: {{ subtotal }}</div>
    <div>总计: {{ finalTotal }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { computed } from "vue";

const priceStream$ = $(100);
const quantityStream$ = $(2);
const discountStream$ = $(0.1); // 10% 折扣

const discountPercentage = computed(() => {
  return (discountStream$.ref.value * 100).toFixed(1);
});

const subtotal = computed(() => {
  return priceStream$.ref.value * quantityStream$.ref.value;
});

const finalTotal = computed(() => {
  const sub = subtotal.value;
  return sub * (1 - discountStream$.ref.value);
});

// 更新价格: 150 * 2 * (1 - 0.1) = 270
priceStream$.next(150);

// 更新数量: 150 * 3 * (1 - 0.1) = 405
quantityStream$.next(3);

// 更新折扣: 150 * 3 * (1 - 0.2) = 360
discountStream$.next(0.2);
</script>
```

## 与 Watch 集成

Stream 可以与 Vue 的 `watch` 集成，当 Stream 的值发生变化时，watch 回调会被触发。

### 基础 Watch

```vue
<template>
  <div>
    <div>值: {{ dataStream$.ref.value }}</div>
    <div>Watch 触发次数: {{ watchCount }} 次</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { watch, ref } from "vue";

const dataStream$ = $("初始值");
const watchCount = ref(0);
const watchCallbacks = [];

// 监听 stream.value 的变化
watch(
  () => dataStream$.ref.value,
  (newVal, oldVal) => {
    watchCallbacks.push({ newVal, oldVal });
    watchCount.value++;
  },
  { immediate: false }, // 不在初始设置时触发
);

// 更新流的值，watch 回调会被触发
dataStream$.next("更新值1");
// watchCallbacks[0] = { newVal: "更新值1", oldVal: "初始值" }

dataStream$.next("更新值2");
// watchCallbacks[1] = { newVal: "更新值2", oldVal: "更新值1" }
</script>
```

## 与 Vue Ref 混合使用

Stream 可以与 Vue 的 `ref` 混合使用，两者都能触发响应式更新：

```vue
<template>
  <div>
    <div>Stream: {{ stream$.ref.value }}</div>
    <div>Ref: {{ refValue }}</div>
    <div>组合计算: {{ combinedValue }}</div>
    <button @click="updateRef">更新 Ref</button>
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { ref, computed } from "vue";

const stream$ = $(100);
const refValue = ref(50);

const combinedValue = computed(() => {
  return stream$.ref.value + refValue.value;
});

const updateRef = () => {
  refValue.value += 10;
};

// 更新 Stream - 会触发 computed 重新计算
stream$.next(200);

// 更新 Ref - 也会触发 computed 重新计算
updateRef();

// 同时更新两者
stream$.next(300);
updateRef();
</script>
```

## 对象属性响应式

Stream 支持对象属性的响应式访问，当对象属性发生变化时，相关的 computed 会自动重新计算：

```vue
<template>
  <div>
    <div>姓名: {{ userName }}</div>
    <div>年龄: {{ userAge }}</div>
    <div>邮箱: {{ userEmail }}</div>
    <div>完整信息: {{ userInfo }}</div>
  </div>
</template>

<script setup>
import { $ } from "fluth";
import { computed } from "vue";

const userStream$ = $({
  name: "张三",
  age: 25,
  email: "zhangsan@example.com",
});

const userName = computed(() => userStream$.ref.value.name);
const userAge = computed(() => userStream$.ref.value.age);
const userEmail = computed(() => userStream$.ref.value.email);
const userInfo = computed(() => {
  const user = userStream$.ref.value;
  return `${user.name} (${user.age}) - ${user.email}`;
});

// 更新用户对象，所有相关的 computed 都会重新计算
userStream$.next({
  name: "李四",
  age: 30,
  email: "lisi@example.com",
});

userStream$.next({
  name: "王五",
  age: 35,
  email: "wangwu@example.com",
});
</script>
```

## 组件卸载时的自动清理

Fluth 会自动处理组件卸载时的清理工作，确保 Stream 的订阅在组件卸载后自动取消：

```vue
<template>
  <div>hello</div>
</template>

<script setup>
import { $ } from "fluth";

const promise$ = $();

// 在 setup 中使用 Stream
promise$.then((value) => console.log(value));

// 当组件卸载时，Stream 的订阅会自动取消
// 后续的 next() 调用不会触发回调
</script>
```

## 总结

Fluth 的响应式功能提供了：

1. **模板渲染**: Stream 的 `ref` 属性可以直接在模板中使用，支持动态渲染
2. **Computed 集成**: Stream 可以触发 computed 的重新计算
3. **Watch 集成**: Stream 可以触发 watch 回调的执行
4. **混合使用**: Stream 可以与 Vue 的 ref 混合使用
5. **对象属性**: 支持对象属性的响应式访问
6. **自动清理**: 组件卸载时自动取消订阅

这些功能让 Fluth 能够与 Vue 的响应式系统完美集成，提供强大的数据流管理能力。
