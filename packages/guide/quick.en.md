# Quick Start

## Installation

```bash
pnpm install fluth-vue
```

## Example

Below is a form submission page to demonstrate the streaming programming paradigm

## Step 1: Create Stream

Use the `$()` function to create a stream:

```vue
<script setup>
import { $ } from "fluth-vue";

// Create a stream with initial value
const form$ = $({
  name: "Alice",
  age: 25,
  email: "alice@example.com",
});
</script>
```

## Step 2: Add Template Rendering

Streams can be used directly in Vue templates. Note that you should not use v-model to bind streams, because stream underlying data is immutable, using v-model will break the immutability of streams.

```vue
<template>
  <div>
    <form>
      <div>
        <label>Product:</label>
        <input
          :value="form$.ref.value.item"
          @input="(value) => form$.set((v) => (v.item = value))"
        />
      </div>
      <div>
        <label>Quantity:</label>
        <input
          :value="form$.ref.value.number"
          @input="(value) => form$.set((v) => (v.number = value))"
        />
      </div>
      <div>
        <label>Size:</label>
        <input
          :value="form$.ref.value.size"
          @input="(value) => form$.set((v) => (v.size = value))"
        />
      </div>
    </form>
    <button>Submit</button>
  </div>
</template>

<script setup>
import { $ } from "fluth-vue";

const form$ = $({
  item: "apple",
  number: 1,
  size: "large",
});
</script>
```

## Step 3: Add Form Logic

```vue
<template>
  <div>
    <form>
      <div>
        <label>Product:</label>
        <input
          :value="form$.ref.value.item"
          @input="(value) => form$.set((v) => (v.item = value))"
        />
      </div>
      <div>
        <label>Quantity:</label>
        <input
          :value="form$.ref.value.number"
          @input="(value) => form$.set((v) => (v.number = value))"
        />
      </div>
      <div>
        <label>Size:</label>
        <input
          :value="form$.ref.value.size"
          @input="(value) => form$.set((v) => (v.size = value))"
        />
      </div>
    </form>
    <button @click="trigger$.next()">Submit</button>
  </div>
</template>

<script setup>
import { $, audit, debounce, useFetch } from "fluth-vue";

const useFetchAddOrder =  () => {
  const { promise$ } =  useFetch({
    url: "https://api.example.com/addOrder",
    { immediate: false, refetch: true },
  });
  return promise$;
};

const form$ = $({
  item: "apple",
  number: 1,
  size: "large",
});

const trigger$ = $();
const submit$ = form$.pipe(audit(trigger$.pipe(debounce(300))));
const validate$ = submit$.then((value) => validateForm(value));
const payload$ = validate$
  .pipe(filter((value) => !!value))
  .then((value) => ({ ...value, user: 'fluth', address: "Beijing Chaoyang District XX Road 88" }));
const addOrder$ = useFetchAddOrder(payload$)
</script>
```
