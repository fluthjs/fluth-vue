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
  item: "apple",
  number: 1,
  size: "large",
});
</script>
```

## Step 2: Add Template Rendering

Streams can be used directly in Vue templates. Note that you should not use v-model to bind streams, because the reactive data of the stream is Readonly.

```vue
<template>
  <div>
    <form>
      <div>
        <label>Product:</label>
        <input
          :value="form$.item"
          @input="(value) => updateForm(value, 'item')"
        />
      </div>
      <div>
        <label>Quantity:</label>
        <input
          :value="form$.number"
          @input="(value) => updateForm(value, 'number')"
        />
      </div>
      <div>
        <label>Size:</label>
        <input
          :value="form$.size"
          @input="(value) => updateForm(value, 'size')"
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

const updateForm = (value, key) => {
  form$.set((v) => (v[key] = value));
};
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
          :value="form$.item"
          @input="(value) => updateForm(value, 'item')"
        />
      </div>
      <div>
        <label>Quantity:</label>
        <input
          :value="form$.number"
          @input="(value) => updateForm(value, 'number')"
        />
      </div>
      <div>
        <label>Size:</label>
        <input
          :value="form$.size"
          @input="(value) => updateForm(value, 'size')"
        />
      </div>
    </form>
    <button @click="trigger$.next()">Submit</button>
  </div>
</template>

<script setup>
import { $, audit, debounce, useFetch, filter } from "fluth-vue";

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

const updateForm = (value, key) => {
  form$.set((v) => (v[key] = value));
};

const trigger$ = $();
const submit$ = form$.pipe(audit(trigger$.pipe(debounce(300))));
const validate$ = submit$.then((value) => validateForm(value));
const payload$ = validate$
  .pipe(filter((value) => !!value))
  .then((value) => ({ ...value, user: 'fluth', address: "No. 88, XX Road, Chaoyang District, Beijing" }));
const addOrder$ = useFetchAddOrder(payload$)
</script>
```
