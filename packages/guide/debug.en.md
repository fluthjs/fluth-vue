# Debugging

fluth provides a series of powerful development tools for developers to use, allowing users to easily debug streaming data.

## Print Plugin

fluth provides a print plugin that can print data modification processes

Single node printing:

```typescript
import { $, consoleNode } from "fluth";

const data$ = $().use(consoleNode());

data$.next(1); // prints resolve 1
data$.next(2); // prints resolve 2
data$.next(3); // prints resolve 3

data$.next(Promise.reject(4)); // prints reject 4
```

Print entire stream:

```typescript
import { $, consoleAll } from "fluth";

const data$ = $().use(consoleAll());
data$
  .then((value) => Promise.reject(value + 1))
  .then((undefined, (value) => ({ current: value })));

data$.next(1);
// prints resolve 1
// prints reject 2
// prints resolve { current: 2 }
```

::: info Note
consoleAll printing the entire stream refers to child nodes created through methods like then, thenOnce, thenImmediate, then$, thenOnce$, thenImmediate$, etc.
:::

## Debug Plugin

:::warning Note
Browsers may filter debugger statements in node_modules, causing debugger breakpoints to not take effect. You need to manually enable debugging for node_modules in browser developer tools -> settings -> ignore list
:::

fluth provides a debug plugin that can debug streaming data

```typescript
import { $, debugNode } from "fluth";

const stream$ = $(0);

stream$.then((value) => value + 1).use(debugNode());

stream$.next(1);
// triggers debugger breakpoint
```

Conditional debugging

```typescript
import { $ } from "fluth";
import { debugAll } from "fluth";

// Only trigger debugger for string types
const conditionFn = (value) => typeof value === "string";
const stream$ = $().use(debugNode(conditionFn));

stream$.next("hello"); // triggers debugger
stream$.next(42); // doesn't trigger debugger
```

Debug entire stream:

```typescript
import { $, debugAll } from "fluth";

const stream$ = $().use(debugAll());

stream$.then((value) => value + 1);

stream$.next(1);
// In browser developer tools, debugger breakpoints will be triggered at each node. Since there are currently only two nodes, it will trigger breakpoints twice
```
