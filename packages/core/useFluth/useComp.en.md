# useComp

`useComp` is a utility function that converts a `fluth` `Stream` or `Observable` into a`Vue` `ComputedRef`.

## Use Cases

When use `fluth` stream data in `Vue` components and want to use it as reactive data in templates, `useComp` provides a convenient way to convert streams into computed properties.

## Basic Usage

```javascript
import { $, useComp } from "fluth-vue";

// In a component's setup function
const stream = $("initial value");
const computedValue = useComp(stream);

// Use in template
<div>{{ computedValue }}</div>;

// When the stream updates, the computed property also updates
stream.next("new value");
// The template will automatically update to display "new value"
```

## Type Definitions

```typescript
// For Stream with initial value
function useComp<T>(arg: Stream<T, true>): ComputedRef<T>;

// For Stream without initial value or Observable
function useComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
```

## Examples

### Stream with Initial Value

```javascript
import { $, useComp } from "fluth-vue";

const stream = $("initial value");
const result = useComp(stream);

console.log(result.value); // Output: "initial value"

stream.next("new value");
console.log(result.value); // Output: "new value"
```

### Stream without Initial Value

```javascript
import { $, useComp } from "fluth-vue";

const stream = $<string>();
const result = useComp(stream);

console.log(result.value); // Output: undefined

stream.next("new value");
console.log(result.value); // Output: "new value"
```

### Using Observable

```javascript
import { $, useComp } from "fluth-vue";

const stream = $(1);
const observable = stream.then((value) => value + 1);
const result = useComp(observable);

console.log(result.value); // Output: undefined

stream.next(2);
console.log(result.value); // Output: 3
```

## Notes

- `useComp` automatically handles cleanup when the component is destroyed, no need to manually unsubscribe
- For Stream without initial value or Observable, the initial value of the computed property is `undefined`
- When the stream value updates, the computed property automatically updates, triggering view updates
