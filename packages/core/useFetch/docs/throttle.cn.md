# 节流 (Throttle)

## 类型定义

```typescript
throttle?:
  | number  // 简单间隔时间（毫秒）
  | {
      wait: number;          // 间隔时间（毫秒）
      options?: {
        leading?: boolean;   // 是否在间隔开始时执行
        trailing?: boolean;  // 是否在间隔结束时执行
      };
    };
```

## 返回值说明

::: warning 重要提示

- 设置 throttle 后，execute() 不再返回 Promise
- 使用 promise$.then() 来处理请求结果
- 使用 data、error、loading 等响应式状态获取结果
  :::

```ts
const { execute, promise$, data, loading, error } = useFetch(url, {
  immediate: false,
  throttle: 1000,
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

execute(); // 触发节流请求
```

## 示例

### 基础用法

通过 throttle 参数控制 useFetch 的节流行为，限制请求频率：

```ts
const { execute } = useFetch(url, {
  immediate: false,
  throttle: 1000, // 每秒最多执行一次
});

// 频繁调用，但每秒最多执行一次
execute(); // ✅ 立即执行
execute(); // ❌ 被节流忽略
execute(); // ❌ 被节流忽略
// 1 秒后可以再次执行
```

### leading: 前缘执行

```ts
// leading: true - 间隔开始时立即执行（默认行为）
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: true, trailing: false },
  },
});

execute(); // ✅ 立即执行
execute(); // ❌ 被节流忽略
// 1 秒内的其他调用都被忽略
```

### trailing: 后缘执行

```ts
// trailing: true - 间隔结束时执行最后一次调用
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: false, trailing: true },
  },
});

execute(); // ❌ 等待间隔结束
execute(); // ❌ 等待间隔结束
execute(); // ✅ 1 秒后执行最后一次
```

### 组合配置

```ts
// leading + trailing: 间隔开始和结束都可能执行
const { execute } = useFetch(url, {
  immediate: false,
  throttle: {
    wait: 1000,
    options: { leading: true, trailing: true },
  },
});

execute(); // ✅ 立即执行（leading）
execute(); // 记录，等待 trailing
execute(); // 记录，等待 trailing
// 1 秒后如果有记录的调用，会执行一次（trailing）
```

## 与其他选项结合

### 与 refresh 结合

```ts
// 自动刷新 + 节流，避免过于频繁
const { data, cancelRefresh } = useFetch("/api/status", {
  refresh: 100, // 尝试每 100ms 刷新
  throttle: 1000, // 但实际每 1000ms 最多执行一次
}).json();
```

### 与 condition 结合

```ts
const isOnline = ref(true);

const { execute } = useFetch("/api/sync", {
  immediate: false,
  throttle: 2000, // 节流 2 秒
  condition: isOnline, // 只在在线时执行
  retry: 3,
});
```

### 与 debounce 区别

```ts
// ❌ 不能同时使用 debounce 和 throttle
// debounce: 延迟执行，频繁调用会重置计时器
// throttle: 限制频率，保证固定间隔内最多执行一次

// 防抖：适合搜索输入
const searchDebounced = useFetch("/api/search", {
  debounce: 300, // 停止输入 300ms 后搜索
});

// 节流：适合滚动事件
const scrollThrottled = useFetch("/api/track", {
  throttle: 200, // 每 200ms 最多记录一次
});
```
