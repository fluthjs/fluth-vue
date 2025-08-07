<script setup>
import Immutable from '../.vitepress/components/immutable.vue'
</script>

# Immutable Data

fluth uses [limu](https://tnfe.github.io/limu/) immutable data at the bottom layer, and only through methods like set, then$, thenOnce$, thenImmediate$ can data be modified immutably.

## Modifying Object Data

```typescript
import { $ } from "fluth-vue";

const stream$ = $({ obj: { name: "fluth", age: 0 } });

// No need to use spread operator {...value, obj: {...value.obj, age: value.obj.age + 1}}
stream$.set((value) => (value.obj.age += 1));
```

## Modifying Array Data

```typescript
import { $ } from "fluth-vue";

const stream$ = $([1, 2, 3]);

// Modify array data
stream$.set((value) => {
  value[0] = 2;
});

// Replace entirely
stream$.next([1, 2, 3, 4]);
```

## Modifying Primitive Data Types

```typescript
import { $ } from "fluth-vue";

const stream$ = $(1);

// Modify primitive data types
stream$.next(2);
```

## Application Scenarios

It's difficult to get snapshots of each modification for ref and reactive objects, but fluth only needs to add a print plugin to clearly understand the entire modification process:

::: code-group

```vue [fluth]
<template>
  <button @click="data$.set((value) => value.nest.age++)">
    add age for fluth: {{ data$.ref.value.nest.age }}
  </button>
</template>

<script>
import { $, toComp, consoleNode } from "../../core/useFluth/index";

const data$ = $({ nest: { name: "fluth", age: 0 } }).use(
  consoleNode("fluth value"),
);
</script>
```

```vue [ref]
<template>
  <button class="immutable-button" @click="data.nest.age++">
    add age for ref: {{ data.nest.age }}
  </button>
</template>

<script setup lang="tsx">
import { ref, watch } from "vue";

const data = ref({ nest: { name: "fluth", age: 0 } });
watch(
  data,
  (newVal) => {
    console.log("ref value", newVal);
  },
  { deep: true },
);
</script>
```

:::

::: details Effect
You can open the console and click the button to see the effect

<Immutable />
:::
