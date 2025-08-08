# Introduction

fluth-vue is a streaming programming library based on [fluth](https://fluthjs.github.io/fluth-doc/index.html). It provides a series of practical stream methods and composable functions, deeply integrating the streaming programming paradigm with Vue's reactive system, fully enjoying the smooth development experience brought by streaming programming.

## Features

- 🌀 **Perfect Ecosystem Integration**: Seamlessly integrates with Vue's reactivity, enjoying Vue's ecosystem and development tools
- 🌊 **Stream-based Programming**: Leverages fluth's powerful streaming programming capabilities to implement reactive programming for logic
- 🤖 **Development Experience**: Achieves ultimate debugging experience through plugins, enjoying the development experience brought by streaming programming

## Applicable Versions

- **Vue 3.2.0 and above**:
  - ✅ All stream subscription behaviors in Vue setup will automatically cancel subscriptions when components are destroyed
  - ✅ Stream data has reactive capabilities and can seamlessly integrate with Vue's reactive system
- **Vue 2.7.0 ~ 3.1.x versions**:
  - ❌ Stream [subscription behaviors](https://fluthjs.github.io/fluth-doc/en/guide/base.html#subscription-nodes) need to be manually [canceled](https://fluthjs.github.io/fluth-doc/en/guide/base.html#cancel-subscription), cannot automatically cancel subscriptions
  - ✅ Stream data has reactive capabilities and can seamlessly integrate with Vue's reactive system
- **Vue versions below 2.7.0**:
  - ❌ Stream subscription behaviors need to be manually [canceled](https://fluthjs.github.io/fluth-doc/en/guide/base.html#cancel-subscription), cannot automatically cancel subscriptions
  - ❌ Stream data doesn't have reactive capabilities, need to use [toCompt](https://fluthjs.github.io/fluth-vue/en/useFluth/#tocompt) to convert to reactive data

::: tip Note
We recommend Vue 3.2.0+ for optimal experience. You may see a peer dependency warning if using Vue < 3.2.0, but the library will still work.
:::

## Installation

```bash
npm install fluth-vue
# or
yarn add fluth-vue
# or
pnpm add fluth-vue
```

## Usage

```typescript
import { $ } from "fluth-vue";

const stream$ = $("hello");
stream$.next("world");
```
