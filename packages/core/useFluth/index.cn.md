# fluth

`fluth` 是一个类 `promise` 的流式编程库。`fluth-vue` 默认集成 `fluth`

具体使用详情见：[fluth](https://fluthjs.github.io/fluth-doc/)

## 使用

```typescript
import { $ } from "fluth";

const promise$ = $();

promise$.then(
  (r) => console.log("resolve", r),
  (e) => console.log("reject", e),
);

promise$.next(1);
promise$.next(Promise.reject(2));
promise$.next(3);

// Logs:
// resolve 2
// resolve 4
// reject 3
```

```typescript
import { $ } from 'fluth'

const promise$ = $(0)
const observable$ = promise$.thenImmediate(v => v + 1)

promise$.value === 0 ✅
observable$.value === 1 ✅

promise$.next(1)

promise$.value === 1 ✅
observable$.value === 2 ✅
```

## 自动取消订阅

在`vue`组件的`setup`函数或者 [effect$](/cn/useFluth/effect$) 中使用`fluth`流，能够自动取消流的订阅。

- 示例

```vue
<template>
  <div></div>
</template>

<script setup lang="tsx">
import { Stream } from "fluth";

const props = defineProps<{
  promise$: Stream<string>;
}>();

props.promise$.then((data) => {
  console.log(data);
});
</script>

<style lang="scss" scoped></style>
```

当`test`组件销毁时`promise$`流在组件内的订阅节点都会自动取消订阅，即当`promise$`流推流后也不会再进行打印了。

## 自动取消订阅的实现原理

`fluth-vue`在`Stream`内置了一个`thenAll`插件，插件实现原理：

```javascript
import { getCurrentScope, onScopeDispose } from "vue";

const vuePlugin = {
  thenAll: (unsubscribe: () => void) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
};
```

对于还不支持`getCurrentScope`的`vue`版本，需要自行实现取消订阅。
