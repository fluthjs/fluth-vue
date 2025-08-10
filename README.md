# fluth-vue

<div align="center">
  <img src="./packages/public/logo.svg" alt="fluth-vue logo" width="120" height="120">
  <p style="margin-top: 20px;">Fluth-based Streaming Programming Library for Vue</p>
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/fluth-vue.svg?style=flat-square)](https://www.npmjs.com/package/fluth-vue)
[![npm downloads](https://img.shields.io/npm/dm/fluth-vue.svg?style=flat-square)](https://www.npmjs.com/package/fluth-vue)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](https://github.com/fluthjs/fluth-vue/blob/master/LICENSE)
[![codecov](https://img.shields.io/codecov/c/github/fluthjs/fluth-vue?style=flat-square)](https://codecov.io/gh/fluthjs/fluth-vue)
[![GitHub stars](https://img.shields.io/github/stars/fluthjs/fluth-vue?style=flat-square)](https://github.com/fluthjs/fluth-vue/stargazers)
[![Vue](https://img.shields.io/badge/Vue-3.2.0+-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

<div align="center">

[official website](https://fluthjs.github.io/fluth-vue/en/)

</div>

[English](./README.md) | [简体中文](./README.cn.md)

</div>

## 🎯 Introduction

fluth-vue is a streaming programming library based on [fluth](https://github.com/fluthjs/fluth). It provides a series of practical stream methods and composable functions, deeply integrating the streaming programming paradigm with Vue's reactive system, fully enjoying the smooth development experience brought by streaming programming.

## 🚀 Features

- 🌀 **Perfect Ecosystem Integration**: Seamlessly integrates with Vue's reactivity, enjoying Vue's ecosystem and development tools
- 🌊 **Stream-based Programming**: Leverages fluth's powerful streaming programming capabilities to implement reactive programming for logic
- 🌈 **Stream Rendering**: More fine-grained stream rendering capabilities, giving you control over rendering timing and frequency
- 🤖 **Development Experience**: Achieves ultimate debugging experience through plugins, enjoying the development experience brought by streaming programming

## 📦 Applicable Versions

- **Vue 3.2.0 and above**:
  - ✅ All stream subscription behaviors in Vue setup will automatically cancel subscriptions when components are destroyed
  - ✅ Stream data has reactive capabilities and can seamlessly integrate with Vue's reactive system
- **Vue 2.7.0 ~ 3.1.x versions**:
  - ❌ Stream [subscription behaviors](https://fluthjs.github.io/fluth-doc/en/guide/base.html#subscription-nodes) need to be manually [canceled](https://fluthjs.github.io/fluth-doc/en/guide/base.html#cancel-subscription), cannot automatically cancel subscriptions
  - ✅ Stream data has reactive capabilities and can seamlessly integrate with Vue's reactive system
- **Vue versions below 2.7.0**:
  - ❌ Stream subscription behaviors need to be manually [canceled](https://fluthjs.github.io/fluth-doc/en/guide/base.html#cancel-subscription), cannot automatically cancel subscriptions
  - ❌ Stream data doesn't have reactive capabilities, need to use [toCompt](https://fluthjs.github.io/fluth-vue/en/useFluth/#tocompt) to convert to reactive data

## 🛠️ Installation

```bash
npm install fluth-vue
# or
yarn add fluth-vue
# or
pnpm add fluth-vue
```

## 🎥 Usage Example

[View](https://code.juejin.cn/pen/7536440340963426314)

```vue
<template>
  <div>{{ stream$ }}</div>
  <div>{{ tips$ }}</div>

  <button @click="updateStream">click</button>
</template>

<script setup lang="ts">
import { $, debounce, filter, map } from "fluth-vue";

const words = [
  "word",
  "i",
  "am",
  "fluth",
  "vue",
  "welcome",
  "everyone",
  "to",
  "try",
  "and",
  "experience",
  "the",
  "amazing",
  "fluth-vue",
  "library",
  "for",
  "reactive",
  "programming",
  "in",
  "vue",
  "applications",
];

const stream$ = $("hello");

const tips$ = stream$.pipe(
  debounce(300),
  map((value) => `debounce: ${value}`),
  filter((value) => value.includes("welcome")),
  map((value) => `filter: ${value}`),
);

const updateStream = () => {
  if (words.length > 0) {
    stream$.next(`${stream$.value} ${words.shift()}`);
  }
};
</script>
```
