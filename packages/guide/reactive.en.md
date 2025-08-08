# Reactivity

fluth provides powerful reactive functionality, allowing streams to seamlessly integrate with Vue's reactive system:

1. Stream data is a Readonly reactive data that can trigger Vue template dynamic rendering, computed recalculation, and watch callback execution like native ref.
2. fluth provides the [to$](/en/useFluth/#to$) method, which can convert Vue's reactive data to streams.
3. Streams provide the [toCompt](/en/useFluth/#tocompt) method, which can convert stream values to computed objects.

::: tip Note

- Stream reactivity requires Vue 3.0+ version. We recommend using Vue 3.2.0+ for optimal experience.

- You should not use v-model to bind stream reactive data, because the reactive data of the stream is Readonly. Directly modifying stream reactive data will not trigger page updates or stream subscriptions, and when the stream's upstream pushes data, it will also overwrite the modified data.

:::

## Reactive Data Rendering

Stream reactive data can be used directly in Vue templates and can be correctly destructured by templates.

```vue
<template>
  <div>
    <p>{{ name$ }}</p>
    <button @click="updateName">Update</button>
  </div>
</template>

<script setup>
import { $ } from "fluth-vue";

const name$ = $("fluth");

const updateName = () => {
  name$.set("fluth-vue");
};
</script>
```

## Reactive Data Update

fluth provides [next](https://fluthjs.github.io/fluth-doc/en/api/stream.html#next) and [set](https://fluthjs.github.io/fluth-doc/en/api/stream.html#set) to modify stream data. For details, see: [Immutable Data](/en/guide/immutable)

```typescript
import { $ } from "fluth-vue";

const stream$ = $({ obj: { name: "fluth", age: 0 } });

// No need to use spread operator {...value, obj: {...value.obj, age: value.obj.age + 1}}
stream$.set((value) => (value.obj.age += 1));
```

## Reactive Data Integration

fluth streams can be seamlessly used in Vue's reactive scenarios like watch, computed, etc. Since stream data itself is reactive Readonly data, you can pass streams directly to APIs like watch, computed, watchEffect, etc., just like using ref or reactive, without additional conversion.

```typescript
import { $ } from "fluth-vue";

const stream$ = $({ obj: { name: "fluth", age: 0 } });

const computed = computed(() => stream$.value.obj.name);

watch(stream$, (value) => {
  console.log(value);
});

// Modifying stream data will trigger recomputation of computed and watch
stream$.set((value) => {
  value.obj.name = "fluth-vue";
  value.obj.age += 1;
});
```

## Decoupling of Reactivity and Data

When using ref or reactive, data and reactivity are integrated. Modifying data will trigger reactivity, and there's no way to achieve conditional reactivity. For example:

```typescript
// wineList will be frequently modified externally
const wineList = ref(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age = ref(0);
const availableWineList = computed(() => {
  age.value > 18 ? wineList.value : [];
});
```

If you want to only get the latest value of wineList when age changes, and not respond to wineList modifications when age doesn't change, computed cannot achieve this.

Of course, you can use watch + cache to achieve this effect:

```typescript
// wineList will be frequently modified externally
const wineList = ref(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age = ref(0);
const availableWineList = ref<string[]>([]);

watch(
  () => age.value,
  (newVal) => {
    if (newVal > 18) {
      availableWineList.value = wineList.value.slice();
    }
  },
);
```

But writing code this way is ugly and requires additional cache availableWineList. Using fluth stream programming can well decouple data and reactivity:

```typescript
const wineList = $(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age$ = $(0);
const availableWineList = age$
  .pipe(filter((age) => age > 18))
  .then(() => wineList.value);
```

Only when age is greater than 18 can you get the latest value of wineList, but subsequent immutable modifications to wineList will not trigger recalculation and value changes of availableWineList.
