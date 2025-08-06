# 防抖 (Debounce)

## 类型定义

```typescript
debounce?:
  | number  // 简单延迟时间（毫秒）
  | {
      wait: number;          // 延迟时间（毫秒）
      options?: {
        leading?: boolean;   // 是否在延迟开始前执行
        maxWait?: number;    // 最大等待时间
        trailing?: boolean;  // 是否在延迟结束后执行
      };
    };
```

## 返回值说明

::: warning 重要提示

- 设置 debounce 后，execute() 不再返回 Promise
- 使用 promise$.then() 来处理请求结果
- 使用 data、error、loading 等响应式状态获取结果
  :::

```ts
const { execute, promise$, data, loading, error } = useFetch(url, {
  immediate: false,
  debounce: 300,
});

// ❌ 错误用法 - execute 不返回 Promise
// const result = await execute();

// ✅ 正确用法 - 使用 promise$
promise$.then((result) => {
  console.log("请求成功:", result);
});

// ✅ 或使用响应式状态
watch(data, (newData) => {
  if (newData) {
    console.log("数据更新:", newData);
  }
});

execute(); // 触发防抖请求
```

## 示例

### 基础用法

通过 debounce 参数控制 useFetch 的防抖行为，避免频繁触发请求：

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: 300, // 300ms 防抖
});

// 快速连续调用，只有最后一次会执行
execute();
execute();
execute(); // ✅ 只有这次会在 300ms 后执行
```

### leading: 前缘触发

```ts
// leading: true - 立即执行第一次调用
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { leading: true, trailing: false },
  },
});

execute(); // ✅ 立即执行
execute(); // ❌ 被防抖取消
execute(); // ❌ 被防抖取消
```

### trailing: 后缘触发

```ts
// trailing: true - 延迟后执行最后一次调用（默认行为）
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { leading: false, trailing: true },
  },
});

execute(); // ❌ 被后续调用取消
execute(); // ❌ 被后续调用取消
execute(); // ✅ 300ms 后执行
```

### maxWait: 最大等待时间

```ts
const { execute } = useFetch(url, {
  immediate: false,
  debounce: {
    wait: 300,
    options: { maxWait: 1000 },
  },
});

// 即使持续调用，也会在 1000ms 时强制执行一次
```

## 与其他选项结合

### 与 refetch 结合

```ts
const query = ref("");

const { data } = useFetch("/api/search", {
  debounce: 300, // 防抖延迟
  refetch: true, // 响应式更新
  condition: () => query.value.length > 2, // 条件限制
})
  .get(() => ({ q: query.value }))
  .json();
```

### 与 retry 结合

```ts
const { execute } = useFetch("/api/data", {
  immediate: false,
  debounce: 500, // 防抖
  retry: 3, // 失败重试
  onFetchError: ({ error }) => {
    console.error("请求失败:", error);
  },
});
```
