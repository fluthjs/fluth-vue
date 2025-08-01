# 快速开始

## 安装

```bash

pnpm install fluth-vue

```

## 引用

在你的 Vue 项目中引入并使用 fluth-vue:

```ts
import { useFetch, $ } from "fluth-vue";

const payload$ = $({});

const url = $("https://api.example.com/users");

const { loading, error, data, promise$ } = useFetch(url, {
  refetch: true,
}).post(payload$);

promise$.then((data) => {
  console.log(data.data);
});
```
