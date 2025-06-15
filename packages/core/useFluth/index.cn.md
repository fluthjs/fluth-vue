# fluth

`fluth` 是一个基于 `promise` 的流式编程库。`fluth-vue` 默认集成 `fluth`

具体使用详情见：[fluth](https://fluthjs.github.io/fluth-doc/)

## 使用

```javascript
import { $ } from "fluth-vue";

const promise$ = $();

promise$.then(
  (r) => console.log("resolve", r),
  (e) => console.log("reject", e),
);

promise$.next(1);
promise$.next(Promise.reject(2));
promise$.next(3);

// Logs:
// resolve 1
// reject 2
// resolve 3
```

## 自动取消订阅

在`vue`组件`setup`函数中使用`fluth`流，当组件销毁时会自动取消流的所有订阅。

- 示例

```typescript
<template>
  <div></div>
</template>

<script setup lang="tsx">
import { promise$ } from "xx/store/xxxxx";

defineOptions({
  name: 'test'
})

const promise$ = $('123');
promise$.then((data) => {
  console.log(data);
})

</script>

<style lang="scss" scoped></style>
```

当`test`组件销毁时`promise$`流在组件内的订阅节点都会自动取消订阅，即当`promise$`流推流后也不会再进行打印了。

::: info 提示
`fluth-vue`对`fluth`的`Stream`流内置了一个插件，当在`vue`组件`setup`使用`Stream`后，组件销毁能够自动销毁`stream`的所有订阅，插件实现原理：

```javascript
import { getCurrentScope, onScopeDispose } from "vue";

const vuePlugin = {
  then: (unsubscribe: () => void) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
};
```

:::
