<script setup>
import Console from "../.vitepress/components/console.vue";
import Debug from "../.vitepress/components/debug.vue";
</script>

# Debugging

fluth provides a series of powerful development tools for developers to use, allowing users to easily debug streaming data.

## Print Plugin

fluth provides a print plugin that can print data modification processes

Single node printing:

```typescript
import { $, consoleNode } from "fluth-vue";

const data$ = $().use(consoleNode());

data$.next(1); // prints resolve 1
data$.next(2); // prints resolve 2
data$.next(3); // prints resolve 3

data$.next(Promise.reject(4)); // prints reject 4
```

Print entire stream:

```typescript
import { $, consoleAll } from "fluth-vue";

const data$ = $().use(consoleAll());
data$
  .pipe(debounce(300))
  .then((value) => {
    throw new Error(value + 1);
  })
  .then(undefined, (error) => ({ current: error.message }));
```

::: details Effect
You can open the console and click the button to see the effect

<Console />
:::

::: info Note
consoleAll printing the entire stream refers to Stream nodes and their Observable child nodes.
:::

## Debug Plugin

:::warning Note
Browsers may filter debugger statements in node_modules, causing debugger breakpoints to not take effect. You need to manually enable debugging for node_modules in browser developer tools -> settings -> ignore list
:::

fluth provides a debug plugin that can debug streaming data

```typescript
import { $, debugNode } from "fluth-vue";

const stream$ = $(0);

stream$.then((value) => value + 1).use(debugNode());

stream$.next(1);
// triggers debugger breakpoint
```

Conditional debugging

```typescript
import { $ } from "fluth-vue";
import { debugAll } from "fluth-vue";

// Only trigger debugger for string types
const conditionFn = (value) => typeof value === "string";
const stream$ = $().use(debugNode(conditionFn));

stream$.next("hello"); // triggers debugger
stream$.next(42); // doesn't trigger debugger
```

Debug entire stream:

```typescript
import { $, debugAll } from "fluth-vue";

const data$ = $().use(debugAll());

data$.then((value) => value + 1).then((value) => value + 1);

const updateData$ = () => {
  data$.next(data$.value + 1);
};
// In browser developer tools, debugger breakpoints will be triggered at each node.
// Since there are currently three nodes, it will trigger breakpoints three times
```

::: details Effect
You can open the console and click the button to see the effect

<Debug />
:::
