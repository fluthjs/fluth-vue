# toComp

`toComp` 是一个用于将 `fluth` 的 `Stream` 或 `Observable` 转换为`Vue`的 `ComputedRef` 的工具函数。

## 类型定义

```typescript
// 对于有初始值的 Stream
function toComp<T>(arg: Stream<T, true>): ComputedRef<T>;

// 对于没有初始值的 Stream 或 Observable
function toComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
```

## 使用场景

当在`Vue`组件中使用 `fluth` 的流式数据，并希望将其作为响应式数据在模板中使用时，`toComp` 提供了一种简便的方式将流转换为计算属性。

## 基本用法

```javascript
import { $, toComp } from "fluth-vue";

// 在组件的 setup 函数中
const stream = $("初始值");
const computedValue = toComp(stream);

// 在模板中使用
<div>{{ computedValue }}</div>;

// 当流更新时，计算属性也会更新
stream.next("新值");
// 此时模板会自动更新显示 "新值"
```

## 示例

### 有初始值的 Stream

```javascript
import { $, toComp } from "fluth-vue";

const stream = $("初始值");
const result = toComp(stream);

console.log(result.value); // 输出: "初始值"

stream.next("新值");
console.log(result.value); // 输出: "新值"
```

### 没有初始值的 Stream

```javascript
import { $, toComp } from "fluth-vue";

const stream = $<string>();
const result = toComp(stream);

console.log(result.value); // 输出: undefined

stream.next("新值");
console.log(result.value); // 输出: "新值"
```

### 使用 Observable

```javascript
import { $, toComp } from "fluth-vue";

const stream = $(1);
const observable = stream.then((value) => value + 1);
const result = toComp(observable);

console.log(result.value); // 输出: undefined

stream.next(2);
console.log(result.value); // 输出: 3
```

## 注意事项

- `toComp` 会自动处理组件销毁时的清理工作，无需手动取消订阅
- 对于没有初始值的 Stream 或 Observable，计算属性的初始值为 `undefined`
- 当流的值更新时，计算属性会自动更新，并触发视图更新
