# 快速上手

## 安装

```bash
pnpm install fluth-vue
```

## 示例

下面以一个表单提页来展示流式编程范式

## 第一步：创建流

使用 `$()` 函数创建一个流：

```vue
<script setup>
import { $ } from "fluth-vue";

// 创建一个带初始值的流
const form$ = $({
  name: "Alice",
  age: 25,
  email: "alice@example.com",
});
</script>
```

## 第二步：添加模板渲染

流可以直接在 Vue 模板中使用，注意不要使用 `v-model` 来绑定流，因为流底层数据是 immutable 的，使用 `v-model` 会破坏流的不可变性。

```vue
<template>
  <div>
    <form>
      <div>
        <label>商品：</label>
        <input
          :value="form$.item"
          @input="(value) => form$.set((v) => (v.item = value))"
        />
      </div>
      <div>
        <label>数量：</label>
        <input
          :value="form$.number"
          @input="(value) => form$.set((v) => (v.number = value))"
        />
      </div>
      <div>
        <label>大小：</label>
        <input
          :value="form$.size"
          @input="(value) => form$.set((v) => (v.size = value))"
        />
      </div>
    </form>
    <button>提交</button>
  </div>
</template>

<script setup>
import { $ } from "fluth-vue";

const form$ = $({
  item: "apple",
  number: 1,
  size: "large",
});
</script>
```

## 第三步：添加表单逻辑

```vue
<template>
  <div>
    <form>
      <div>
        <label>商品：</label>
        <input
          :value="form$.item"
          @input="(value) => form$.set((v) => (v.item = value))"
        />
      </div>
      <div>
        <label>数量：</label>
        <input
          :value="form$.number"
          @input="(value) => form$.set((v) => (v.number = value))"
        />
      </div>
      <div>
        <label>大小：</label>
        <input
          :value="form$.size"
          @input="(value) => form$.set((v) => (v.size = value))"
        />
      </div>
    </form>
    <button @click="trigger$.next()">提交</button>
  </div>
</template>

<script setup>
import { $, audit, debounce, useFetch } from "fluth-vue";

const useFetchAddOrder =  () => {
  const { promise$ } =  useFetch({
    url: "https://api.example.com/addOrder",
    { immediate: false, refetch: true },
  });
  return promise$;
};

const form$ = $({
  item: "apple",
  number: 1,
  size: "large",
});

const trigger$ = $();
const submit$ = form$.pipe(audit(trigger$.pipe(debounce(300))));
const validate$ = submit$.then((value) => validateForm(value));
const payload$ = validate$
  .pipe(filter((value) => !!value))
  .then((value) => ({ ...value, address: "北京市朝阳区XX路88号" }));
const addOrder$ = useFetchAddOrder(payload$)
</script>
```
