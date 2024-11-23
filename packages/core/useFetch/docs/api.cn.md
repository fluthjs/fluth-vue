---
outline: deep
---

<script setup>
import UseFetch from '../../../.vitepress/components/useFetch.vue'
import CreateFetch from '../../../.vitepress/components/createFetch.vue'
</script>

# 预览

[[toc]]

## useFetch

<UseFetch />

- 类型

  ```typescript
  declare function useFetch<T>(
    url: MaybeRefOrGetter<string>,
    fetchOptions?: UseFetchOptions,
  ): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
  ```

- 详情
  `useFetch` 请求器

### UseFetchOptions

```ts
interface UseFetchOptions extends RequestInit {
  /**
   * Initial data before the request finished
   *
   * @default null
   */
  initialData?: any;

  /**
   * Will automatically run fetch when `useFetch` is used
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * execute fetch only when condition is true
   * @default true
   */
  condition?: MaybeRefOrGetter<boolean>;

  /**
   * Will automatically refetch when:
   * - the URL is changed if the URL is a ref
   * - the payload is changed if the payload is a ref
   *
   * @default false
   */
  refetch?: boolean;

  /**
   * Auto refetch interval in millisecond
   * @default undefined
   */
  refresh?: number;

  /**
   *  Allow cache the request result and reuse it if cacheResolve result is same
   *
   * @default undefined
   */
  cacheSetting?: {
    expiration?: number;
    cacheResolve?: (config: InternalConfig & { url: string }) => string;
  };

  /**
   * Debounce interval in millisecond
   *
   * @default undefined
   */
  debounce?:
    | number
    | {
        wait: number;
        options?: {
          leading?: boolean;
          maxWait?: number;
          trailing?: boolean;
        };
      };

  /**
   * Throttle interval in millisecond
   *
   * @default undefined
   */
  throttle?:
    | number
    | {
        wait: number;
        options?: {
          leading?: boolean;
          trailing?: boolean;
        };
      };

  /**
   * Indicates if the fetch request has finished
   */
  isFinished?: boolean;

  /**
   * Timeout for abort request after number of millisecond
   * `0` means use browser default
   *
   * @default undefined
   */
  timeout?: number;

  /**
   * Fetch function
   */
  fetch?: typeof window.fetch;

  /**
   * Allow update the `data` ref when fetch error whenever provided, or mutated in the `onFetchError` callback
   *
   * @default false
   */
  updateDataOnError?: boolean;

  /**
   * Will run immediately before the fetch request is dispatched
   */
  beforeFetch?: (
    ctx: BeforeFetchContext,
  ) =>
    | Promise<Partial<BeforeFetchContext> | void>
    | Partial<BeforeFetchContext>
    | void;

  /**
   * Will run immediately after the fetch request is returned.
   * Runs after any 2xx response
   */
  afterFetch?: (
    ctx: AfterFetchContext,
  ) => Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;

  /**
   * Will run immediately after the fetch request is returned.
   * Runs after any 4xx and 5xx response
   */
  onFetchError?: (ctx: {
    data: any;
    response: Response | null;
    error: any;
  }) => Promise<Partial<OnFetchErrorContext>> | Partial<OnFetchErrorContext>;
}
```

#### initialData

- 类型

  ```typescript
  any;
  ```

- 详情

  请求完成前的初始数据

  默认值: `null`

#### immediate

- 类型

  ```typescript
  boolean;
  ```

- 详情

  是否在使用 `useFetch` 时自动执行请求

  默认值: `true`

#### condition

- 类型

  ```typescript
  MaybeRefOrGetter<boolean>;
  ```

- 详情

  仅在条件为 true 时执行请求

  默认值: `true`

#### refetch

- 类型

  ```typescript
  boolean;
  ```

- 详情

  当以下情况发生时是否自动重新请求：

  - URL 是 ref 且发生改变时
  - payload 是 ref 且发生改变时

  默认值: `false`

#### refresh

- 类型

  ```typescript
  number;
  ```

- 详情

  自动刷新间隔（毫秒）

#### retry

- 类型

  ```typescript
  number;
  ```

- 详情

  发生错误自动重试次数

#### cacheSetting

- 类型

  ```typescript
  interface InternalConfig {
    method: HttpMethod;
    type: DataType;
    payload: unknown;
    payloadType?: string;
  }
  interface CacheSetting {
    expiration?: number;
    cacheResolve?: (config: InternalConfig & { url: string }) => string;
  }
  ```

- 详情

  请求结果缓存设置

  默认值: `{}`

#### debounce

- 类型

  ```typescript
  type Debounce =
    | number
    | {
        wait: number;
        options?: {
          leading?: boolean;
          maxWait?: number;
          trailing?: boolean;
        };
      };
  ```

- 详情

  请求防抖间隔（毫秒），当为对象是用法和效果与 [lodash.throttle](https://lodash.com/docs/4.17.15#throttle) 相同

#### throttle

- 类型

  ```typescript
  type Throttle =
    | number
    | {
        wait: number;
        options?: {
          leading?: boolean;
          trailing?: boolean;
        };
      };
  ```

- 详情

  请求节流间隔（毫秒），当为对象是用法和效果与 [lodash.throttle](https://lodash.com/docs/4.17.15#throttle) 相同

#### isFinished

- 类型

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- 详情

  指示 fetch 是否完成

#### timeout

- 类型

  ```typescript
  number;
  ```

- 详情

  请求超时时间（毫秒），`0` 表示使用浏览器默认值

#### fetch

- 类型

  ```typescript
  typeof window.fetch;
  ```

- 详情

  自定义的 fetch 函数实现

#### updateDataOnError

- 类型

  ```typescript
  boolean;
  ```

- 详情

  当请求发生错误时，是否允许更新 `data` ref

  默认值: `false`

#### beforeFetch

- 类型

  ```typescript
  interface BeforeFetchContext {
    url: string;
    options: UseFetchOptions;
    cancel: Fn;
  }
  type beforeFetch = (
    ctx: BeforeFetchContext,
  ) =>
    | Promise<Partial<BeforeFetchContext> | void>
    | Partial<BeforeFetchContext>
    | void;
  ```

- 详情

  请求发送前的钩子函数

#### afterFetch

- 类型

  ```typescript
  (ctx: AfterFetchContext) =>
    Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;
  ```

- 详情

  请求成功（2xx 响应）后的钩子函数

#### onFetchError

- 类型

  ```typescript
  (ctx: { data: any; response: Response | null; error: any }) =>
    Promise<Partial<OnFetchErrorContext>> | Partial<OnFetchErrorContext>;
  ```

- 详情

  请求失败（4xx、5xx 响应）后的钩子函数

  #### requestInit

- 类型

  ```typescript
  interface RequestInit {
    /** A BodyInit object or null to set request's body. */
    body?: BodyInit | null;
    /** A string indicating how the request will interact with the browser's cache to set request's cache. */
    cache?: RequestCache;
    /** A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials. */
    credentials?: RequestCredentials;
    /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
    headers?: HeadersInit;
    /** A cryptographic hash of the resource to be fetched by request. Sets request's integrity. */
    integrity?: string;
    /** A boolean to set request's keepalive. */
    keepalive?: boolean;
    /** A string to set request's method. */
    method?: string;
    /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
    mode?: RequestMode;
    priority?: RequestPriority;
    /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
    redirect?: RequestRedirect;
    /** A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer. */
    referrer?: string;
    /** A referrer policy to set request's referrerPolicy. */
    referrerPolicy?: ReferrerPolicy;
    /** An AbortSignal to set request's signal. */
    signal?: AbortSignal | null;
    /** Can only be null. Used to disassociate request from any Window. */
    window?: null;
  }
  ```

- 详情

`UseFetchOptions` 继承了 `RequestInit`所有属性，可以设置 `RequestInit` 的任意属性

### UseFetchReturn

- 类型

```ts
interface UseFetchReturn<T> {
  /**
   * Indicates if the fetch request has finished
   */
  isFinished: Readonly<Ref<boolean>>;
  /**
   * The statusCode of the HTTP fetch response
   */
  statusCode: Ref<number | null>;
  /**
   * The raw response of the fetch response
   */
  response: Ref<Response | null>;
  /**
   * Any fetch errors that may have occurred
   */
  error: Ref<any>;
  /**
   * The fetch response body on success, may either be JSON or text
   */
  data: Ref<T | null>;
  /**
   * Indicates if the request is currently being fetched.
   */
  loading: Readonly<Ref<boolean>>;
  /**
   * Indicates if the fetch request is able to be aborted
   */
  canAbort: ComputedRef<boolean>;
  /**
   * Indicates if the fetch request was aborted
   */
  aborted: Ref<boolean>;
  /**
   * promise stream
   */
  promise$: Readonly<Subjection>;
  /**
   * Abort the fetch request
   */
  abort: Fn;
  /**
   *  Cancel refresh request
   */
  cancelRefresh: Fn;
  /**
   * clear current fetch cache
   */
  clearCache: Fn;
  /**
   * Manually call the fetch
   * (default not throwing error)
   */
  execute: (throwOnFailed?: boolean) => Promise<any> | void;
  /**
   * Fires after the fetch request has finished
   */
  onFetchResponse: EventHookOn<Response>;
  /**
   * Fires after a fetch request error
   */
  onFetchError: EventHookOn;
  /**
   * Fires after a fetch has completed
   */
  onFetchFinally: EventHookOn;
  get: (payload?: MaybeRefOrGetter<unknown>) => UseFetchResult<T>;
  post: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  put: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  delete: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  patch: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  head: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  options: (
    payload?: MaybeRefOrGetter<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  json: <JSON = any>() => UseFetchReturn<JSON> &
    PromiseLike<UseFetchReturn<JSON>>;
  text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  arrayBuffer: () => UseFetchReturn<ArrayBuffer> &
    PromiseLike<UseFetchReturn<ArrayBuffer>>;
  formData: () => UseFetchReturn<FormData> &
    PromiseLike<UseFetchReturn<FormData>>;
}
```

- 详情

  `useFetch` 的返回值类型，包含以下属性和方法:

#### data

- 类型

  ```typescript
  Ref<T | null>;
  ```

- 详情
  成功时的 fetch 响应体，可能是 JSON 或文本

#### loading

- 类型

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- 详情

#### error

- 类型

  ```typescript
  Ref<any>;
  ```

- 详情

  失败时的错误信息

#### isFinished

- 类型

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- 详情

  指示 fetch 是否完成

#### statusCode

- 类型

  ```typescript
  Ref<number | null>;
  ```

- 详情

  The statusCode of the HTTP fetch response

#### response

- 类型

  ```typescript
  Ref<Response | null>;
  ```

- 详情

  原始的 fetch 响应对象

#### canAbort

- 类型

  ```typescript
  ComputedRef<boolean>;
  ```

- 详情

  指示当前请求是否可以被中止

#### aborted

- 类型

  ```typescript
  Ref<boolean>;
  ```

- 详情

  指示请求是否已被中止

#### promise$

- 类型

  ```typescript
  Readonly<Subjection>;
  ```

- 详情

  [fluth](https://fluthjs.github.io/fluth-doc/index.html) 流，每次发起请求后都会向订阅者推送最新数据

#### execute

- 类型

  ```typescript
  (throwOnFailed?: boolean) => Promise<any> | void;
  ```

- 详情

  - 手动触发 fetch 请求（默认不抛出错误）
  - 当设置 `debounce` 或 `throttle` 时，执行后返回 void

#### abort

- 类型

  ```typescript
  () => void;
  ```

- 详情

  中止当前 fetch 请求

#### cancelRefresh

- 类型

  ```typescript
  () => void;
  ```

- 详情

  取消自动刷新请求

#### clearCache

- 类型

  ```typescript
  () => void;
  ```

- 详情

  清除当前请求的缓存

#### onFetchResponse

- 类型

  ```typescript
  EventHookOn<Response>;
  ```

- 详情

  fetch 请求完成后的回调

#### onFetchError

- 类型

  ```typescript
  EventHookOn;
  ```

- 详情

  fetch 请求发生错误时的回调

#### onFetchFinally

- 类型

  ```typescript
  EventHookOn;
  ```

- 详情

  fetch 请求完成时的回调（无论成功或失败）

#### get

- 类型

  ```typescript
  type get: (payload?: MaybeRefOrGetter<unknown>) => UseFetchResult<T>;
  ```

- 详情

  设置 fetch 请求的方法为 `GET`，并提供 payload，payload 会被解析成 query 参数覆盖到 url 上，payload 可以为响应式数据

#### post

- 类型

  ```typescript
  type post: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `POST`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### put

- 详情

  - 设置 fetch 请求的方法为 `PUT`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

- 类型

  ```typescript
  type put: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `PUT`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### delete

- 类型

  ```typescript
  type delete: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `DELETE`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
    - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### patch

- 类型

  ```typescript
  type patch: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `PATCH`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### head

- 类型

  ```typescript
  type head: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `HEAD`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### options

- 类型

  ```typescript
  type options: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- 详情

  - 设置 fetch 请求的方法为 `OPTIONS`，并提供 payload，payload 会被传入 body 中，payload 可以为响应式数据
  - type 可以指定 header 的 `Content-Type`，常见设置为 json 或者 text

#### json

- 类型

  ```typescript
  type json: <JSON = any>() => UseFetchReturn<JSON> & PromiseLike<UseFetchReturn<JSON>>;
  ```

- 详情

  将响应体解析为 JSON 格式

#### text

- 类型

  ```typescript
  type text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  ```

- 详情

  将响应体解析为文本格式

#### blob

- 类型

  ```typescript
  type blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  ```

- 详情

  将响应体解析为 Blob 格式

#### arrayBuffer

- 类型

  ```typescript
  type arrayBuffer: () => UseFetchReturn<ArrayBuffer> & PromiseLike<UseFetchReturn<ArrayBuffer>>;
  ```

- 详情

  将响应体解析为 ArrayBuffer 格式

#### formData

- 类型

  ```typescript
  type formData: () => UseFetchReturn<FormData> & PromiseLike<UseFetchReturn<FormData>>;
  ```

- 详情

  将响应体解析为 FormData 格式

## createFetch

- 类型

  ```typescript
  interface CreateFetchOptions {
    baseUrl?: MaybeRefOrGetter<string>;
    combination?: "overwrite" | "chain";
    options?: UseFetchOptions;
  }
  declare function createFetch(config?: CreateFetchOptions): typeof useFetch;
  ```

- 详情

  创建预置配置的 `useFetch`

## clearFetchCache

- 类型

  ```typescript
  declare function clearFetchCache: () => void
  ```

- 详情

  清除所有 `useFetch` 的缓存
