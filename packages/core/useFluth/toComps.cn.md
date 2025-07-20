# toComps

`toComps` 是一个用于将包含 `Stream` 或 `Observable` 属性的对象转换为包含 `ComputedRef` 属性的对象的工具函数。

::: warning 注意
如果在`Vue`组件中使用 `toComps`，需要在组件的 `setup` 函数中使用 `toComps`，以便在组件销毁时自动取消订阅，如果在`template`中使用 `toComps`，可能会有内存泄漏的风险
:::

## 使用场景

当你有一个对象，其中包含多个 `Stream` 或 `Observable` 属性，并希望将它们批量转换为 Vue 的计算属性以便在模板中使用时，`toComps` 提供了一种便捷的批量转换方式。

## 基本用法

```javascript
import { $, toComps } from "fluth-vue";

// 创建包含 Stream 的对象
const streams = {
  name: $("张三"),
  age: $(25),
  email: $("zhangsan@example.com"),
  regularProp: "普通属性", // 非 Stream 属性保持不变
};

// 转换为计算属性对象
const computedRefs = toComps(streams);

// 在模板中使用
// {{ computedRefs.name }} - {{ computedRefs.age }} - {{ computedRefs.email }}
```

## 类型定义

```typescript
function toComps<T extends Record<string, any>>(
  target: T,
): {
  [K in keyof T]: T[K] extends Stream<infer U, any> | Observable<infer U>
    ? ComputedRef<U | undefined>
    : T[K];
};
```

## 示例

### 基本转换

```javascript
import { $, toComps } from "fluth-vue";

const streams = {
  prop1: $("值1"),
  prop2: $(42),
  normalProp: "不是 Stream",
};

const result = toComps(streams);

console.log(result.prop1.value); // 输出: "值1"
console.log(result.prop2.value); // 输出: 42
console.log(result.normalProp); // 输出: "不是 Stream"
```

### 混合 Stream 和 Observable

```javascript
import { $, toComps } from "fluth-vue";

const stream1 = $("Stream 值");
const stream2 = $(10);
const observable = stream2.then((value) => value * 2);

const target = {
  streamProp: stream1,
  observableProp: observable,
  regularProp: "普通属性",
  numberProp: 123,
};

const result = toComps(target);

console.log(result.streamProp.value); // 输出: "Stream 值"
console.log(result.observableProp.value); // 输出: undefined (Observable 初始值)
console.log(result.regularProp); // 输出: "普通属性"
console.log(result.numberProp); // 输出: 123

// 触发 Observable
stream2.next(5);
console.log(result.observableProp.value); // 输出: 10
```

### 处理无初始值的 Stream

```javascript
import { $, toComps } from 'fluth-vue';

const stream1 = $<string>(); // 无初始值
const stream2 = $<number>(); // 无初始值

const target = {
  prop1: stream1,
  prop2: stream2
};

const result = toComps(target);

console.log(result.prop1.value); // 输出: undefined
console.log(result.prop2.value); // 输出: undefined

// 设置值后
stream1.next('第一个值');
stream2.next(42);

console.log(result.prop1.value); // 输出: "第一个值"
console.log(result.prop2.value); // 输出: 42
```

### 动态更新

```javascript
import { $, toComps } from "fluth-vue";

const stream1 = $("初始值1");
const stream2 = $("初始值2");

const target = {
  prop1: stream1,
  prop2: stream2,
};

const result = toComps(target);

console.log(result.prop1.value); // 输出: "初始值1"
console.log(result.prop2.value); // 输出: "初始值2"

// 更新 Stream 值
stream1.next("更新值1");
stream2.next("更新值2");

console.log(result.prop1.value); // 输出: "更新值1"
console.log(result.prop2.value); // 输出: "更新值2"
```

### 复杂数据类型

```javascript
import { $, toComps } from "fluth-vue";

const objectStream = $({ name: "test", value: 123 });
const arrayStream = $([1, 2, 3]);

const target = {
  objectProp: objectStream,
  arrayProp: arrayStream,
};

const result = toComps(target);

console.log(result.objectProp.value); // 输出: { name: 'test', value: 123 }
console.log(result.arrayProp.value); // 输出: [1, 2, 3]

// 更新复杂数据
objectStream.next({ name: "updated", value: 456 });
arrayStream.next([4, 5, 6]);

console.log(result.objectProp.value); // 输出: { name: 'updated', value: 456 }
console.log(result.arrayProp.value); // 输出: [4, 5, 6]
```

## 转换规则

1. **Stream/Observable 属性**：转换为 `ComputedRef`
2. **普通属性**：保持原样，不进行转换
3. **嵌套对象**：只转换顶层属性，嵌套对象内的 Stream 不会被转换
4. **空对象**：返回空对象

```javascript
import { $, toComps } from "fluth-vue";

const topLevelStream = $("顶层");
const nestedStream = $("嵌套");

const target = {
  topStream: topLevelStream,
  nested: {
    innerStream: nestedStream, // 这个不会被转换
    regularProp: "普通属性",
  },
  regularProp: "顶层普通属性",
};

const result = toComps(target);

// 顶层 Stream 被转换为 ComputedRef
console.log(result.topStream.value); // 输出: "顶层"

// 嵌套对象保持原样
console.log(result.nested); // 输出: { innerStream: nestedStream, regularProp: '普通属性' }

// 普通属性保持不变
console.log(result.regularProp); // 输出: "顶层普通属性"
```

## 错误处理

`toComps` 只接受对象作为参数，传入其他类型会抛出错误：

```javascript
import { toComps } from "fluth-vue";

// 以下调用会抛出错误
try {
  toComps("字符串"); // 错误
} catch (error) {
  console.log(error.message); // 输出: "comComps param must be object"
}

try {
  toComps(123); // 错误
} catch (error) {
  console.log(error.message); // 输出: "comComps param must be object"
}

try {
  toComps([]); // 错误 (数组不被接受)
} catch (error) {
  console.log(error.message); // 输出: "comComps param must be object"
}
```

## 在 Vue 组件中使用

```vue
<template>
  <div>
    <h1>{{ computedRefs.title }}</h1>
    <p>用户: {{ computedRefs.username }}</p>
    <p>年龄: {{ computedRefs.age }}</p>
    <p>状态: {{ computedRefs.status }}</p>
  </div>
</template>

<script setup>
import { $, toComps } from "fluth-vue";

// 创建 Stream 对象
const userStreams = {
  title: $("用户信息"),
  username: $("张三"),
  age: $(25),
  status: $("在线"),
};

// 转换为计算属性
const computedRefs = toComps(userStreams);

// 模拟数据更新
setTimeout(() => {
  userStreams.username.next("李四");
  userStreams.age.next(30);
  userStreams.status.next("离线");
}, 2000);
</script>
```

## 注意事项

1. **浅层转换**：只转换对象的顶层属性，不会递归转换嵌套对象
2. **类型安全**：转换后的 ComputedRef 类型为 `ComputedRef<T | undefined>`
3. **生命周期**：转换后的 ComputedRef 会自动处理生命周期，无需手动清理
4. **性能**：批量转换比逐个转换更高效
5. **只读性**：转换后的 ComputedRef 是只读的，不能直接修改其值
