# 条件控制

## 类型

```typescript
condition?:
  | MaybeRefOrGetter<boolean>
  | Observable<boolean>
  | Stream<boolean>
  | (() => boolean)
```

- **默认值**: true

## 用法

通过 condition 参数控制 useFetch 是否发起请求。只有当条件为 true 时，请求才会执行。

### 基础用法

```ts
// 布尔值
const { data } = useFetch(url, { condition: true });

// 响应式引用
const shouldFetch = ref(false);
const { data } = useFetch(url, { condition: shouldFetch });

// 计算属性
const payload = ref({ id: 1 });
const condition = computed(() => !!payload.value.id);
const { data } = useFetch(url, { refetch: true, condition })
  .get(payload)
  .json();

payload.value.id = 2; // ✅ 触发请求 (condition 为 true)
payload.value.id = null; // ❌ 不触发请求 (condition 为 false)

// 函数
const { data } = useFetch(url, {
  condition: () => userStore.isLoggedIn && userStore.hasPermission,
});

// Observable/Stream
const condition$ = $(false);
const { data } = useFetch(url, { condition: condition$ });
```

::: warning 注意
condition 条件对以下操作都生效：

- 响应式更新 refetch
- 自动刷新 refresh
- 手动执行 execute
- 初始化请求 immediate
  :::

## 返回值

当 condition 为 false 时，execute() 方法返回 Promise.resolve(null)，不会发起实际的网络请求。
