# 快速开始

## 安装

```bash

pnpm install fluth-vue

```

## 引用

在你的 Vue 项目中引入并使用 fluth-vue:

```ts
import { useFetch, Stream } from "fluth-vue";

const promise$ = new Stream();

const { loading, error, data } = useFetch(url);
```
