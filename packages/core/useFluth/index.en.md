# fluth

`fluth` is a Promise-like streaming programming library. `fluth-vue` includes `fluth` by default.

For detailed usage, see: [fluth](https://fluthjs.github.io/fluth-doc/)

## Usage

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
// resolve 3
// reject 2
```

## Operators

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

::: info Note
`fluth-vue` includes a built-in `then` plugin for `Stream` that automatically destroys all stream subscriptions when a Vue component is destroyed when using `Stream` in the component's `setup`. The plugin implementation principle:

```javascript
import { getCurrentScope, onScopeDispose } from "vue";

streamInstance.plugin.then = [
  (unsubscribe) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
];
```

For Vue versions that don't support `getCurrentScope`, you need to implement unsubscription manually.
:::
