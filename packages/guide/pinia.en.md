# Pinia Integration

fluth-vue recommends extracting all business logic to the logic layer and modeling the business, with business models driving the view layer, where the view layer is only responsible for consuming data.

In the Vue ecosystem, the best implementation of the logic layer is Pinia. Pinia is Vue's official state management library, providing powerful state management capabilities that can meet most business requirements.

fluth-vue is perfectly compatible with Pinia. Stream data can be directly viewed in the Pinia panel of vue-devtools.

In Pinia, through modular design principles and fluth-vue's reactive programming approach, business layer and view layer decoupling can be easily achieved.

## Example

Through a simple example, we demonstrate how to implement business models in Pinia combined with fluth-vue's reactive data:

### Code Directory

The logic layer is uniformly placed in the store directory. useModuleA and useModuleB represent two business modules, with each module's logic existing in the form of services.

```js
└── store
    ├── index.ts
    │
    ├── useModuleA
    │   ├── services
    │   │   ├── useServiceA.ts
    │   │   └── useServiceB.ts
    │   │   └── ...
    │   └── index.ts
    │
    ├── useModuleB
    │   ├── services
    │   │   ├── useServiceC.ts
    │   │   └── useServiceD.ts
    │   │   └── ...
    │   └── index.ts
    └── ...

```

### Module

The module only does two things:

1. Define dependencies between modules
2. Define dependencies between services

If logic is a book, then the module is the chapters of the book, and services are the content of the book's chapters.

```typescript
import { defineStore } from "pinia";
import { reactive } from "vue";
import { $ } from "fluth-vue";
import { useModuleB } from "./useModuleB";

const useModuleAStore = defineStore("moduleA", () => {
  // Define dependencies between modules
  const moduleB = useModuleB();

  // Define dependencies between services
  const serviceA = useServiceA(moduleB.serviceC);
  const serviceB = useServiceB(serviceA);

  // Services must be wrapped with reactive
  // This way vue-devtools can directly view the reactive data of services in Pinia
  return {
    serviceA: reactive(serviceA),
    serviceB: reactive(serviceB),
  };
});
```

### Service

Implementation of useServiceA:

```typescript
import { useServiceC } from "../../useModuleB/services/useServiceC";
import { recover$, merge } from "fluth-vue";

const useServiceA = (serviceC: ReturnType<typeof useServiceC>) => {
  // Recover stream instances from reactive
  const { dataC$ } = recover$(serviceC);

  const dataA$ = $("A");
  const dataB$ = $(1);

  merge(dataA$, dataC$).then((data) => {
    // Detailed logic
  });

  dataB$.then((dataB) => {
    // Detailed logic
  });

  return {
    dataA$,
    dataB$,
  };
};
```

Implementation of useServiceB:

```typescript
// Define business service B
const useServiceB = (serviceA: ReturnType<typeof useServiceA>) => {
  const { dataA$ } = serviceA;

  const dataC$ = $("C");
  const dataD$ = $(3);

  dataC$.then((dataC) => {
    // Detailed logic
  });

  promiseAll(dataA$, dataD$).then(([dataA, dataD]) => {
    // Detailed logic
  });

  return {
    dataC$,
    dataD$,
  };
};
```

### View Layer Consumption

```vue
<template>
  <div>
    <div>{{ dataA$ }}</div>
    <div>{{ dataC$ }}</div>

    <button @click="addDataB">Click</button>
    <button @click="addDataD">Click 2</button>
  </div>
</template>

<script setup lang="ts">
import { useModuleAStore } from "@/store";
import { recover$ } from "fluth-vue";

const moduleAStore = useModuleAStore();

// Recover stream instances from reactive
const { dataA$, dataB$ } = recover$(moduleAStore.serviceA);
const { dataC$, dataD$ } = recover$(moduleAStore.serviceB);

const addDataB = () => {
  dataB$.next(dataB$.value + 1);
};

const addDataD = () => {
  dataD$.next(dataD$.value + 1);
};
</script>
```
