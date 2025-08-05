# 简介

`fluth-vue` 是一个基于 [fluth](https://fluthjs.github.io/fluth-doc/index.html) 的流式编程库。它提供了一系列流实用的方法和组合式函数，将流式编程范式与 Vue 的响应式系统深度整合，充分享受流式编程带来的丝滑开发体验。

## 特点

- 🌀 **完美融入生态**：与 vue 响应式无缝衔接，享受 vue 的生态和开发工具
- 🌊 **基于流式编程**：利用 `fluth` 强大的流式编程能力，实现逻辑的响应式编程
- 🤖 **开发体验**：通过插件实现极致的调试体验，享受流式编程带来的开发体验

## 适用范围

- **vue 3.2.0 及以上版本**：
  - ✅ `setup` 中所有的流的订阅行为会随组件的销毁而自动取消订阅
  - ✅ 流的数据具备响应式能力，可以与 vue 的响应式系统无缝衔接。
- **vue 2.7 ~ 3.1.x 版本**：
  - ❌ 流的[订阅行为](https://fluthjs.github.io/fluth-doc/cn/guide/base.html#%E8%AE%A2%E9%98%85%E8%8A%82%E7%82%B9)都需要手动[取消订阅](https://fluthjs.github.io/fluth-doc/cn/guide/base.html#取消订阅)，无法自动取消订阅。
  - ✅ 流的数据具备响应式能力，可以与 vue 的响应式系统无缝衔接。
- **vue 2.7 以下版本**：
  - ❌ 流的订阅行为都需要手动[取消订阅](https://fluthjs.github.io/fluth-doc/cn/guide/base.html#取消订阅)，无法自动取消订阅。
  - ❌ 流的数据不具备响应式能力，需要用 [toComp](https://fluthjs.github.io/fluth-vue/cn/useFluth/toComp.html) 转换为响应式数据。
