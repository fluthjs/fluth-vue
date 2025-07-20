# to$

`to$` 是一个用于将 Vue 的响应式数据（`ref`、`reactive`、`computed`）转换为 `fluth` 的 `Stream` 的工具函数。

## 类型定义

```typescript
function to$<T>(arg: Ref<T> | ComputedRef<T> | Reactive<T>): Stream<T, true>;
```

## 详情

当你需要将 Vue 的响应式数据转换为流式数据，以便在 `fluth` 生态系统中使用时，`to$` 提供了一种简便的转换方式。转换后的数据会进行`deep clone`再给到`Stream`。

## 示例

## 基本用法

```javascript
import { ref, reactive, computed } from "vue";
import { to$ } from "fluth-vue";

// 转换 ref
const refValue = ref("初始值");
const stream$ = to$(refValue);

// 转换 reactive 对象
const reactiveObj = reactive({ count: 0, name: "test" });
const reactiveStream$ = to$(reactiveObj);

// 转换 computed
const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const computedStream$ = to$(computedValue);
```

### 转换 ref

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref("初始值");
const stream$ = to$(refValue);

console.log(stream$.value); // 输出: "初始值"

// 监听 stream 变化
stream$.then((value) => {
  console.log("Stream 值更新:", value);
});

// 修改 ref 值
refValue.value = "新值";
// Stream 会自动接收到新值
```

### 转换 reactive 对象

```javascript
import { reactive } from "vue";
import { to$ } from "fluth-vue";

const reactiveObj = reactive({ count: 0, name: "test" });
const stream$ = to$(reactiveObj);

console.log(stream$.value); // 输出: { count: 0, name: 'test' }

// 监听变化
stream$.then((value) => {
  console.log("对象更新:", value);
});

// 修改 reactive 对象
reactiveObj.count = 1;
// Stream 会接收到更新后的完整对象
```

### 转换 computed

```javascript
import { ref, computed } from "vue";
import { to$ } from "fluth-vue";

const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const stream$ = to$(computedValue);

console.log(stream$.value); // 输出: 20

// 监听计算属性变化
stream$.then((value) => {
  console.log("计算值更新:", value);
});

// 修改基础 ref
baseRef.value = 15;
// Stream 会接收到新的计算值: 30
```

### 深层响应式变化

```javascript
import { reactive } from "vue";
import { to$ } from "fluth-vue";

const reactiveObj = reactive({
  nested: {
    value: "初始值",
  },
});
const stream$ = to$(reactiveObj);

// 监听深层变化
stream$.then((value) => {
  console.log("深层变化:", value.nested.value);
});

// 修改嵌套属性
reactiveObj.nested.value = "更新值";
// Stream 能够检测到深层变化
```

## 不可变性（Immutable）特性

`to$` 函数返回的 Stream 具有不可变性特性，这意味着：

1. **深克隆**：每次值变化时，Stream 接收到的是原始数据的深克隆副本
2. **数据安全**：修改 Stream 中的数据不会影响原始的 Vue 响应式数据
3. **单向数据流**：数据只从 Vue 响应式对象流向 Stream

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref({ data: "原始值" });
const stream$ = to$(refValue);

// 获取初始值的引用
const originalValue = refValue.value;

// 修改 ref 值
refValue.value = { data: "修改值" };

// 原始值保持不变（不可变性）
console.log(originalValue.data); // 输出: "原始值"
console.log(refValue.value.data); // 输出: "修改值"
console.log(stream$.value.data); // 输出: "修改值"
```

## 注意事项

`to$` 函数会自动处理生命周期管理：

1. **自动清理**：当 Stream 完成或取消订阅时，内部的 `watch` 监听器会被自动清理

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref("初始值");
const stream$ = to$(refValue);

// 完成 Stream
stream$.complete();

// 此后修改 ref 值，Stream 不会再接收到更新
refValue.value = "完成后的值";
// Stream 的 watch 监听器已被清理
```

2. **性能考虑**：由于使用了深克隆（`cloneDeep`），对于大型对象可能会有性能影响
3. **深度监听**：函数使用 `{ deep: true }` 选项来监听深层变化
