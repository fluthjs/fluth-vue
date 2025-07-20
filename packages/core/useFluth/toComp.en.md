# toComp

`toComp` is a utility function that converts a `fluth` `Stream` or `Observable` into a `Vue` `ComputedRef`.

## Use Cases

When using `fluth` stream data in `Vue` components and wanting to use it as reactive data in templates, `toComp` provides a convenient way to convert streams into computed properties.

## Type Definitions

```typescript
// For Stream with initial value
function toComp<T>(arg: Stream<T, true>): ComputedRef<T>;

// For Stream without initial value or Observable
function toComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
```

## Basic Usage

```javascript
import { $, toComp } from "fluth-vue";

// In a component's setup function
const stream = $("initial value");
const computedValue = toComp(stream);

// Use in template
<div>{{ computedValue }}</div>;

// When the stream updates, the computed property also updates
stream.next("new value");
// The template will automatically update to display "new value"
```

## Examples

### Stream with Initial Value

```javascript
import { $, toComp } from "fluth-vue";

const stream = $("initial value");
const result = toComp(stream);

console.log(result.value); // Output: "initial value"

stream.next("new value");
console.log(result.value); // Output: "new value"
```

### Stream without Initial Value

```javascript
import { $, toComp } from "fluth-vue";

const stream = $<string>();
const result = toComp(stream);

console.log(result.value); // Output: undefined

stream.next("new value");
console.log(result.value); // Output: "new value"
```

### Using Observable

```javascript
import { $, toComp } from "fluth-vue";

const stream = $(1);
const observable = stream.then((value) => value + 1);
const result = toComp(observable);

console.log(result.value); // Output: undefined

stream.next(2);
console.log(result.value); // Output: 3
```

## Notes

- `toComp` automatically handles cleanup when the component is destroyed, no need to manually unsubscribe
- For Stream without initial value or Observable, the initial value of the computed property is `undefined`
- When the stream value updates, the computed property automatically updates, triggering view updates
