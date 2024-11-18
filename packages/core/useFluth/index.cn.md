# fluth

`fluth` 是一个基于 `promise` 的流式编程库。`fluth-vue` 默认集成 `fluth`

具体使用详情见：[fluth](https://fluthjs.github.io/fluth-doc/)

## 使用

```javascript
import { Stream } from "fluth-vue";

const promise$ = new Stream();

promise$.then(
  (r) => console.log("resolve", r),
  (e) => console.log("reject", e)
);

promise$.next(1);
promise$.next(Promise.reject(2));
promise$.next(3);

// Logs:
// resolve 1
// reject 2
// resolve 3
```

## 操作符

```javascript
import { Stream, fork, finish, combine, concat, merge, partition, race } from "fluth-vue";

const promise1$ = new Stream();
const promise2$ = new Stream();

const forkPromise$ = fork(promise1$);

const finishPromise$ = finish(promise1$, promise2$);

const combinePromise$ = combine(promise1$, promise2$);

const concatPromise$ = concat(promise1$, promise2$);

const mergePromise$ = merge(promise1$, promise2$);

const [selection$, unSelection$] = partition(promise1$, (data) => data % 2 === 1);

const racePromise$ = race(promise1$, promise2$);
```

::: warning 提示
`fluth-vue`对`fluth`的`Stream`流内置了一个插件，当在`vue`组件`setup`使用`Stream`后，组件销毁能够自动销毁`stream`的所有订阅，插件实现原理：

```javascript
import { getCurrentScope, onScopeDispose } from "vue";

streamInstance.plugin.then = [
  (unsubscribe) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
];
```

:::
