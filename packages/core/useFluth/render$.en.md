# render$ Directive

The `render$` directive is a Vue directive that dynamically renders Stream or Observable values to DOM element text content.

::: info Note
Using the directive to render streams will not trigger component updates, only trigger element updates, similar to [signals](https://github.com/tc39/proposal-signals)
:::

## Syntax

```vue
<div v-render$="stream$"></div>
```

## Examples

### Stream

```vue
<template>
  <div>
    <div v-render$="message$"></div>
    <button @click="updateMessage">Update Message</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const vRender$ = render$;

const message$ = $("Hello World");

const updateMessage = () => {
  message$.next("Message updated!");
};
</script>
```

### Observable

```vue
<template>
  <div>
    <div v-render$="processedData$"></div>
    <button @click="updateData">Update Data</button>
  </div>
</template>

<script setup>
import { $, render$ } from "fluth-vue";

const vRender$ = render$;

const rawData$ = $("raw data");
const processedData$ = rawData$.then((data) => `Processed: ${data}`);

const updateData = () => {
  rawData$.next("new data");
};
</script>
```

### Chained Operations

```vue
<template>
  <!-- ✅ Good performance, only object$.value.attr.name change will trigger re-render -->
  <div v-render$="object$.pipe(get((v) => v.attr.name))"></div>

  <!-- ❌ bad performance, object$ change will trigger re-render, but attr name change will not -->
  <div v-render$="object$.then((v) => v.attr.name)"></div>
</template>

<script setup>
import { $, get, render$ } from "fluth-vue";

const vRender$ = render$;

const object$ = $({ id: 1, attr: { name: "fluth", age: 18 } });
</script>
```
