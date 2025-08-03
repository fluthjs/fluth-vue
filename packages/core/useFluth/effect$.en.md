# effect$

## Description

`effect$` is a higher-order function that creates a render effect scope wrapper. It automatically cleans up previous side effects when the render function is called again and cleans up all side effects when the component unmounts, effectively preventing memory leaks.

## Syntax

```typescript
function effect$(render: RenderFunction): () => VNodeChild;
```

## Parameters

- `render: RenderFunction` - Vue render function that returns VNode or other renderable content

## Return Value

Returns a wrapped render function that:

- Stops the previous effect scope on each call
- Creates a new effect scope to execute the render function
- Automatically cleans up the last effect scope when the component unmounts

## Core Mechanism

`effect$` manages side effects through the following mechanisms:

1. **Scope Management**: Uses Vue's `effectScope` to create isolated side effect scopes
2. **Automatic Cleanup**: Stops previous scopes on each render to prevent effect accumulation
3. **Lifecycle Binding**: Binds to component lifecycle through `onScopeDispose` to ensure resource cleanup on unmount

## Use Cases

### Main Problems

When directly using streams or other reactive data sources in Vue components, you may encounter:

1. **Duplicate Subscriptions**: Each component re-render creates new subscriptions without cleaning up old ones
2. **Memory Leaks**: Subscriptions may not be properly cleaned up when components unmount
3. **Performance Issues**: Multiple duplicate subscriptions cause unnecessary computation and updates

### Solution

Using `effect$` to wrap render functions solves these problems by ensuring:

- Only one active subscription per re-render
- All subscriptions are properly cleaned up on component unmount
- No memory leaks or performance issues

## Basic Usage

### Not Recommended (without effect$ wrapper)

```typescript
import { defineComponent, h } from "vue";
import { $, render$, toComp } from "fluth-vue";

const TestComponent = defineComponent({
  setup() {
    const stream$ = $("Hello");
    const trigger$ = $("trigger");
    const trigger = toComp(trigger$);

    // ❌ Not recommended: Creates new subscriptions on each re-render
    return () =>
      h("div", null, [
        h(render$(stream$.thenImmediate((v) => v))),
        h("span", null, "-"),
        h("span", null, trigger.value),
      ]);
  },
});
```

### Recommended (with effect$ wrapper)

```typescript
import { defineComponent, h } from "vue";
import { $, render$, effect$, toComp } from "fluth-vue";

const TestComponent = defineComponent({
  setup() {
    const stream$ = $("Hello");
    const trigger$ = $("trigger");
    const trigger = toComp(trigger$);

    // ✅ Recommended: Use effect$ wrapper for automatic subscription lifecycle management
    return effect$(() =>
      h("div", null, [
        h(render$(stream$.thenImmediate((v) => v))),
        h("span", null, "-"),
        h("span", null, trigger.value),
      ]),
    );
  },
});
```

## Advanced Usage

### Using with toComp

```typescript
import { defineComponent, h } from "vue";
import { $, effect$, toComp } from "fluth-vue";

const AdvancedComponent = defineComponent({
  setup() {
    const userStream$ = $({ name: "John", age: 30 });
    const statusStream$ = $("loading");

    return effect$(() => {
      const user = toComp(userStream$);
      const status = toComp(statusStream$);

      return h("div", null, [
        h("h2", null, `User: ${user.value?.name}`),
        h("p", null, `Age: ${user.value?.age}`),
        h("p", null, `Status: ${status.value}`),
      ]);
    });
  },
});
```

### Conditional Rendering

```typescript
import { defineComponent, h } from "vue";
import { $, effect$, toComp } from "fluth-vue";

const ConditionalComponent = defineComponent({
  setup() {
    const showDetails$ = $(false);
    const userInfo$ = $({ name: "Alice", email: "alice@example.com" });

    return effect$(() => {
      const showDetails = toComp(showDetails$);
      const userInfo = toComp(userInfo$);

      return h("div", null, [
        h(
          "button",
          {
            onClick: () => showDetails$.next(!showDetails.value),
          },
          "Toggle Details",
        ),

        showDetails.value
          ? h("div", null, [
              h("p", null, `Name: ${userInfo.value?.name}`),
              h("p", null, `Email: ${userInfo.value?.email}`),
            ])
          : h("p", null, "Click button to show details"),
      ]);
    });
  },
});
```

## Performance Comparison

### Issues without effect$

When component re-renders multiple times:

```typescript
// Assume 3 re-renders are triggered
trigger$.next("trigger1");
trigger$.next("trigger2");
trigger$.next("trigger3");

// Then stream emits new value
stream$.next("test");

// Result: 4 subscriptions respond simultaneously (1 initial + 3 duplicates),
// causing 4 identical processing operations
```

### Advantages with effect$

```typescript
// Same scenario but with effect$ wrapper
trigger$.next("trigger1");
trigger$.next("trigger2");
trigger$.next("trigger3");

// Then stream emits new value
stream$.next("test");

// Result: Only 1 active subscription responds,
// only 1 processing operation, better performance
```

## Important Notes

1. **Render Functions Only**: `effect$` is specifically designed for wrapping Vue component render functions
2. **Automatic Cleanup**: No need to manually manage subscription cleanup, `effect$` handles it automatically
3. **Lifecycle Binding**: Ensure usage within Vue component's setup function
4. **Performance Optimization**: Use in components with streams or reactive data sources for significant performance improvements

## Related APIs

- [`render$`](./render$.en.md) - Render streams as Vue components
- [`toComp`](./toComp.en.md) - Convert streams to Vue computed properties
- [`to$`](./to$.en.md) - Convert Vue reactive data to streams

## TypeScript Support

```typescript
import { RenderFunction, VNodeChild } from "vue";

declare function effect$(render: RenderFunction): () => VNodeChild;
```

Full type support ensures type safety in TypeScript projects.
