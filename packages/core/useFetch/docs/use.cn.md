# 使用方式

## 基础用法

`useFetch` 函数可以通过简单地提供一个 URL 来使用。URL 可以是字符串或者是一个 `ref`。`data` 对象将包含请求的结果，`error` 对象将包含任何错误信息，而 `loading` 对象将指示请求是否正在加载中。

```ts
import { useFetch } from "fluth-vue";

const { loading, error, data } = useFetch(url);
```

## 异步用法

`useFetch` 也可以像普通的 fetch 一样被等待。注意，当一个组件是异步的时候，任何使用该组件的组件都必须用 `<Suspense>` 标签包裹。你可以在[Vue 3 官方文档](https://vuejs.org/guide/built-ins/suspense.html)中了解更多关于 suspense API 的信息。

```ts
import { useFetch } from "fluth-vue";

const { loading, error, data } = await useFetch(url);
```

## URL 变化时重新获取

使用 `ref` 作为 url 参数将允许 `useFetch` 函数在 url 发生变化时自动触发另一个请求。

```ts
const url = ref("https://my-api.com/user/1");

const { data } = useFetch(url, { refetch: true });

url.value = "https://my-api.com/user/2"; // 将触发另一个请求
```

## 防止请求立即触发

将 `immediate` 选项设置为 false 将阻止请求立即触发，直到调用 `execute` 函数。

```ts
const { execute } = useFetch(url, { immediate: false });

execute();
```

## 中止请求

可以使用 `useFetch` 函数的 `abort` 函数来中止请求。`canAbort` 属性表示请求是否可以被中止。

```ts
const { abort, canAbort } = useFetch(url);

setTimeout(() => {
  if (canAbort.value) abort();
}, 100);
```

也可以通过使用 `timeout` 属性来自动中止请求。当达到指定的超时时间时，它将调用 `abort` 函数。

```ts
const { data } = useFetch(url, { timeout: 100 });
```

## 拦截请求

`beforeFetch` 选项可以在请求发送之前拦截请求并修改请求选项和 URL。

```ts
const { data } = useFetch(url, {
  async beforeFetch({ url, options, cancel }) {
    const myToken = await getMyToken();

    if (!myToken) cancel();

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${myToken}`,
    };

    return {
      options,
    };
  },
});
```

`afterFetch` 选项可以在响应数据更新之前拦截响应数据。

```ts
const { data } = useFetch(url, {
  afterFetch(ctx) {
    if (ctx.data.title === "HxH") ctx.data.title = "Hunter x Hunter"; // 修改响应数据

    return ctx;
  },
});
```

当 `updateDataOnError` 设置为 `true` 时，`onFetchError` 选项可以在更新之前拦截响应数据和错误。

```ts
const { data } = useFetch(url, {
  updateDataOnError: true,
  onFetchError(ctx) {
    // 当收到 5xx 响应时，ctx.data 可能为 null
    if (ctx.data === null) ctx.data = { title: "Hunter x Hunter" }; // 修改响应数据

    ctx.error = new Error("自定义错误"); // 修改错误
    return ctx;
  },
});

console.log(data.value); // { title: 'Hunter x Hunter' }
```

## 设置请求方法和返回类型

可以通过在 `useFetch` 后面添加适当的方法来设置请求方法和返回类型

```ts
// 请求将使用 GET 方法发送，数据将解析为 JSON
const { data } = useFetch(url).get().json();

// 请求将使用 POST 方法发送，数据将解析为文本
const { data } = useFetch(url).post().text();

// 或者使用选项设置方法

// 请求将使用 GET 方法发送，数据将解析为 blob
const { data } = useFetch(url, { method: "GET" }, { refetch: true }).blob();
```

## 创建自定义实例

`createFetch` 函数将返回一个带有预配置选项的 useFetch 函数。这对于在整个应用程序中与使用相同基础 URL 或需要授权头的 API 进行交互非常有用。

```ts
const useMyFetch = createFetch({
  baseUrl: "https://my-api.com",
  options: {
    mode: "cors",
    async beforeFetch({ options }) {
      const myToken = await getMyToken();
      options.headers.Authorization = `Bearer ${myToken}`;

      return { options };
    },
  },
});

const { loading, error, data } = useMyFetch("users");
```

如果你想要控制预配置实例和新生成实例之间的 `beforeFetch`、`afterFetch`、`onFetchError` 的行为，你可以提供一个 `combination` 选项来在 `overwrite` 或 `chaining` 之间切换。

```ts
const useMyFetch = createFetch({
  baseUrl: "https://my-api.com",
  combination: "overwrite",
  options: {
    // 只有当新生成的实例没有传递 beforeFetch 时，预配置实例中的 beforeFetch 才会运行
    async beforeFetch({ options }) {
      const myToken = await getMyToken();
      options.headers.Authorization = `Bearer ${myToken}`;

      return { options };
    },
  },
});

// 使用 useMyFetch 的 beforeFetch
const { loading, error, data } = useMyFetch("users");

// 使用自定义的 beforeFetch
const { loading, error, data } = useMyFetch("users", {
  async beforeFetch({ url, options, cancel }) {
    const myToken = await getMyToken();

    if (!myToken) cancel();

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${myToken}`,
    };

    return {
      options,
    };
  },
});
```

## 事件

`onFetchResponse` 和 `onFetchError` 将分别在获取请求响应和错误时触发。

```ts
const { onFetchResponse, onFetchError } = useFetch(url);

onFetchResponse((response) => {
  console.log(response.status);
});

onFetchError((error) => {
  console.error(error.message);
});
```
