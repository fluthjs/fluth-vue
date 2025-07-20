# to$

`to$` is a utility function that converts Vue's reactive data (`ref`, `reactive`, `computed`) into a `fluth` `Stream`.

## Type Definition

```typescript
function to$<T>(arg: Ref<T> | ComputedRef<T> | Reactive<T>): Stream<T, true>;
```

## Details

When you need to convert Vue's reactive data into stream data for use in the `fluth` ecosystem, `to$` provides a convenient conversion method. The converted data will be `deep cloned` before being passed to the `Stream`.

## Examples

## Basic Usage

```javascript
import { ref, reactive, computed } from "vue";
import { to$ } from "fluth-vue";

// Convert ref
const refValue = ref("initial value");
const stream$ = to$(refValue);

// Convert reactive object
const reactiveObj = reactive({ count: 0, name: "test" });
const reactiveStream$ = to$(reactiveObj);

// Convert computed
const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const computedStream$ = to$(computedValue);
```

### Converting ref

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref("initial value");
const stream$ = to$(refValue);

console.log(stream$.value); // Output: "initial value"

// Listen to stream changes
stream$.then((value) => {
  console.log("Stream value updated:", value);
});

// Modify ref value
refValue.value = "new value";
// Stream will automatically receive the new value
```

### Converting reactive object

```javascript
import { reactive } from "vue";
import { to$ } from "fluth-vue";

const reactiveObj = reactive({ count: 0, name: "test" });
const stream$ = to$(reactiveObj);

console.log(stream$.value); // Output: { count: 0, name: 'test' }

// Listen to changes
stream$.then((value) => {
  console.log("Object updated:", value);
});

// Modify reactive object
reactiveObj.count = 1;
// Stream will receive the updated complete object
```

### Converting computed

```javascript
import { ref, computed } from "vue";
import { to$ } from "fluth-vue";

const baseRef = ref(10);
const computedValue = computed(() => baseRef.value * 2);
const stream$ = to$(computedValue);

console.log(stream$.value); // Output: 20

// Listen to computed property changes
stream$.then((value) => {
  console.log("Computed value updated:", value);
});

// Modify base ref
baseRef.value = 15;
// Stream will receive the new computed value: 30
```

### Deep reactive changes

```javascript
import { reactive } from "vue";
import { to$ } from "fluth-vue";

const reactiveObj = reactive({
  nested: {
    value: "initial value",
  },
});
const stream$ = to$(reactiveObj);

// Listen to deep changes
stream$.then((value) => {
  console.log("Deep change:", value.nested.value);
});

// Modify nested property
reactiveObj.nested.value = "updated value";
// Stream can detect deep changes
```

## Immutability Feature

The Stream returned by the `to$` function has immutability characteristics, which means:

1. **Deep cloning**: Each time the value changes, the Stream receives a deep cloned copy of the original data
2. **Data safety**: Modifying data in the Stream will not affect the original Vue reactive data
3. **Unidirectional data flow**: Data only flows from Vue reactive objects to Stream

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref({ data: "original value" });
const stream$ = to$(refValue);

// Get reference to initial value
const originalValue = refValue.value;

// Modify ref value
refValue.value = { data: "modified value" };

// Original value remains unchanged (immutability)
console.log(originalValue.data); // Output: "original value"
console.log(refValue.value.data); // Output: "modified value"
console.log(stream$.value.data); // Output: "modified value"
```

## Notes

The `to$` function automatically handles lifecycle management:

1. **Automatic cleanup**: When the Stream completes or unsubscribes, the internal `watch` listener will be automatically cleaned up

```javascript
import { ref } from "vue";
import { to$ } from "fluth-vue";

const refValue = ref("initial value");
const stream$ = to$(refValue);

// Complete the Stream
stream$.complete();

// After this, modifying the ref value will not update the Stream
refValue.value = "value after completion";
// The Stream's watch listener has been cleaned up
```

2. **Performance considerations**: Due to the use of deep cloning (`cloneDeep`), there may be performance implications for large objects
3. **Deep watching**: The function uses the `{ deep: true }` option to watch for deep changes