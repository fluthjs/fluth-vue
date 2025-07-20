# toComps

`toComps` is a utility function that converts an object containing `Stream` or `Observable` properties into an object containing `ComputedRef` properties.

## Use Cases

When you have an object containing multiple `Stream` or `Observable` properties and want to batch convert them into Vue computed properties for use in templates, `toComps` provides a convenient batch conversion method.

## Basic Usage

```javascript
import { $, toComps } from "fluth-vue";

// Create object containing Streams
const streams = {
  name: $("John"),
  age: $(25),
  email: $("john@example.com"),
  regularProp: "regular property", // Non-Stream properties remain unchanged
};

// Convert to computed properties object
const computedRefs = toComps(streams);

// Use in template
// {{ computedRefs.name }} - {{ computedRefs.age }} - {{ computedRefs.email }}
```

## Type Definition

```typescript
function toComps<T extends Record<string, any>>(
  target: T,
): {
  [K in keyof T]: T[K] extends Stream<infer U, any> | Observable<infer U>
    ? ComputedRef<U | undefined>
    : T[K];
};
```

## Examples

### Basic Conversion

```javascript
import { $, toComps } from "fluth-vue";

const streams = {
  prop1: $("value1"),
  prop2: $(42),
  normalProp: "not a Stream",
};

const result = toComps(streams);

console.log(result.prop1.value); // Output: "value1"
console.log(result.prop2.value); // Output: 42
console.log(result.normalProp); // Output: "not a Stream"
```

### Mixed Stream and Observable

```javascript
import { $, toComps } from "fluth-vue";

const stream1 = $("Stream value");
const stream2 = $(10);
const observable = stream2.then((value) => value * 2);

const target = {
  streamProp: stream1,
  observableProp: observable,
  regularProp: "regular property",
  numberProp: 123,
};

const result = toComps(target);

console.log(result.streamProp.value); // Output: "Stream value"
console.log(result.observableProp.value); // Output: undefined (Observable initial value)
console.log(result.regularProp); // Output: "regular property"
console.log(result.numberProp); // Output: 123

// Trigger Observable
stream2.next(5);
console.log(result.observableProp.value); // Output: 10
```

### Handling Streams without Initial Values

```javascript
import { $, toComps } from 'fluth-vue';

const stream1 = $<string>(); // No initial value
const stream2 = $<number>(); // No initial value

const target = {
  prop1: stream1,
  prop2: stream2
};

const result = toComps(target);

console.log(result.prop1.value); // Output: undefined
console.log(result.prop2.value); // Output: undefined

// After setting values
stream1.next('first value');
stream2.next(42);

console.log(result.prop1.value); // Output: "first value"
console.log(result.prop2.value); // Output: 42
```

### Dynamic Updates

```javascript
import { $, toComps } from "fluth-vue";

const stream1 = $("initial value1");
const stream2 = $("initial value2");

const target = {
  prop1: stream1,
  prop2: stream2,
};

const result = toComps(target);

console.log(result.prop1.value); // Output: "initial value1"
console.log(result.prop2.value); // Output: "initial value2"

// Update Stream values
stream1.next("updated value1");
stream2.next("updated value2");

console.log(result.prop1.value); // Output: "updated value1"
console.log(result.prop2.value); // Output: "updated value2"
```

### Complex Data Types

```javascript
import { $, toComps } from "fluth-vue";

const objectStream = $({ name: "test", value: 123 });
const arrayStream = $([1, 2, 3]);

const target = {
  objectProp: objectStream,
  arrayProp: arrayStream,
};

const result = toComps(target);

console.log(result.objectProp.value); // Output: { name: 'test', value: 123 }
console.log(result.arrayProp.value); // Output: [1, 2, 3]

// Update complex data
objectStream.next({ name: "updated", value: 456 });
arrayStream.next([4, 5, 6]);

console.log(result.objectProp.value); // Output: { name: 'updated', value: 456 }
console.log(result.arrayProp.value); // Output: [4, 5, 6]
```

## Conversion Rules

1. **Stream/Observable properties**: Converted to `ComputedRef`
2. **Regular properties**: Remain unchanged, no conversion
3. **Nested objects**: Only top-level properties are converted, Streams in nested objects are not converted
4. **Empty objects**: Return empty object

```javascript
import { $, toComps } from "fluth-vue";

const topLevelStream = $("top level");
const nestedStream = $("nested");

const target = {
  topStream: topLevelStream,
  nested: {
    innerStream: nestedStream, // This will not be converted
    regularProp: "regular property",
  },
  regularProp: "top level regular property",
};

const result = toComps(target);

// Top-level Stream converted to ComputedRef
console.log(result.topStream.value); // Output: "top level"

// Nested object remains unchanged
console.log(result.nested); // Output: { innerStream: nestedStream, regularProp: 'regular property' }

// Regular properties remain unchanged
console.log(result.regularProp); // Output: "top level regular property"
```

## Error Handling

`toComps` only accepts objects as parameters, passing other types will throw an error:

```javascript
import { toComps } from "fluth-vue";

// The following calls will throw errors
try {
  toComps("string"); // Error
} catch (error) {
  console.log(error.message); // Output: "comComps param must be object"
}

try {
  toComps(123); // Error
} catch (error) {
  console.log(error.message); // Output: "comComps param must be object"
}

try {
  toComps([]); // Error (arrays are not accepted)
} catch (error) {
  console.log(error.message); // Output: "comComps param must be object"
}
```

## Using in Vue Components

```vue
<template>
  <div>
    <h1>{{ computedRefs.title }}</h1>
    <p>User: {{ computedRefs.username }}</p>
    <p>Age: {{ computedRefs.age }}</p>
    <p>Status: {{ computedRefs.status }}</p>
  </div>
</template>

<script setup>
import { $, toComps } from "fluth-vue";

// Create Stream object
const userStreams = {
  title: $("User Information"),
  username: $("John"),
  age: $(25),
  status: $("Online"),
};

// Convert to computed properties
const computedRefs = toComps(userStreams);

// Simulate data updates
setTimeout(() => {
  userStreams.username.next("Jane");
  userStreams.age.next(30);
  userStreams.status.next("Offline");
}, 2000);
</script>
```

## Notes

1. **Shallow conversion**: Only converts top-level properties of the object, does not recursively convert nested objects
2. **Type safety**: The converted ComputedRef type is `ComputedRef<T | undefined>`
3. **Lifecycle**: The converted ComputedRef automatically handles lifecycle, no manual cleanup required
4. **Performance**: Batch conversion is more efficient than individual conversions
5. **Read-only**: The converted ComputedRef is read-only, its value cannot be directly modified
