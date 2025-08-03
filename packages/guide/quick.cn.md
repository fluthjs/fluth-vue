# 快速开始

## 安装

```bash
pnpm install fluth-vue

```

## 引用

在你的 Vue 项目中使用 fluth-vue:

```ts
import { useFetch, $ } from "fluth-vue";

const user$ = $({ name: "fluth", age: 18 });
const home$ = $({ city: "shenzhen", address: "tech park" });

const payload$ = combine(user$, home$).then(([user, home]) => ({
  name: user.name,
  age: user.age,
  city: home.city,
  address: home.address,
}));

const { promise$: info$ } = useFetch("https://api.example.com/find", {
  refetch: true,
}).post(payload$);

info$.then((data) => {
  console.log(data);
});
```
