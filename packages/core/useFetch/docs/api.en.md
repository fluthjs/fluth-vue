---
outline: deep
---

<script setup>
import UseFetch from '../../../.vitepress/components/useFetch.vue'
import CreateFetch from '../../../.vitepress/components/createFetch.vue'
</script>

# Preview

[[toc]]

## useFetch

<UseFetch />

- Type

  ```typescript
  declare function useFetch<T>(
    url: MaybeRefOrGetter<string>,
    fetchOptions?: UseFetchOptions
  ): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
  ```

- Details
  `useFetch` requester

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
    ctx: BeforeFetchContext
  ) => Promise<Partial<BeforeFetchContext> | void> | Partial<BeforeFetchContext> | void;

  /**
   * Will run immediately after the fetch request is returned.
   * Runs after any 2xx response
   */
  afterFetch?: (ctx: AfterFetchContext) => Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;

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

- Type

  ```typescript
  any;
  ```

- Details

  Initial data before the request is completed

  Default: `null`

#### immediate

- Type

  ```typescript
  boolean;
  ```

- Details

  Whether to automatically execute the request when `useFetch` is used

  Default: `true`

#### condition

- Type

  ```typescript
  MaybeRefOrGetter<boolean>;
  ```

- Details

  Execute request only when condition is true

  Default: `true`

#### refetch

- Type

  ```typescript
  boolean;
  ```

- Details

  Whether to automatically refetch when:
  - URL is a ref and changes
  - payload is a ref and changes

  Default: `false`

#### refresh

- Type

  ```typescript
  number;
  ```

- Details

  Auto refresh interval in milliseconds

#### cacheSetting

- Type

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

- Details

  Request result cache settings

  Default: `{}`

#### debounce

- Type

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

- Details

  Request debounce interval in milliseconds. When an object is used, the usage and effect are the same as [lodash.debounce](https://lodash.com/docs/4.17.15#debounce)

#### throttle

- Type

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

- Details

  Request throttle interval in milliseconds. When an object is used, the usage and effect are the same as [lodash.throttle](https://lodash.com/docs/4.17.15#throttle)

#### isFinished

- Type

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- Details

  Indicates if the fetch request has finished

#### timeout

- Type

  ```typescript
  number;
  ```

- Details

  Request timeout in milliseconds, `0` means use browser default

#### fetch

- Type

  ```typescript
  typeof window.fetch;
  ```

- Details

  Custom fetch function implementation

#### updateDataOnError

- Type

  ```typescript
  boolean;
  ```

- Details

  Whether to allow updating the `data` ref when a fetch error occurs

  Default: `false`

#### beforeFetch

- Type

  ```typescript
  interface BeforeFetchContext {
    url: string;
    options: UseFetchOptions;
    cancel: Fn;
  }
  type beforeFetch = (
    ctx: BeforeFetchContext
  ) => Promise<Partial<BeforeFetchContext> | void> | Partial<BeforeFetchContext> | void;
  ```

- Details

  Hook function before the request is sent

#### afterFetch

- Type

  ```typescript
  (ctx: AfterFetchContext) => Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;
  ```

- Details

  Hook function after successful request (2xx response)

#### onFetchError

- Type

  ```typescript
  (ctx: { data: any; response: Response | null; error: any }) =>
    Promise<Partial<OnFetchErrorContext>> | Partial<OnFetchErrorContext>;
  ```

- Details

  Hook function after failed request (4xx, 5xx response)

#### requestInit

- Type

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

- Details

  `UseFetchOptions` inherits all properties from `RequestInit`, allowing you to set any `RequestInit` property

### UseFetchReturn

- Type

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
  post: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  put: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  delete: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  patch: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  head: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  options: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  json: <JSON = any>() => UseFetchReturn<JSON> & PromiseLike<UseFetchReturn<JSON>>;
  text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  arrayBuffer: () => UseFetchReturn<ArrayBuffer> & PromiseLike<UseFetchReturn<ArrayBuffer>>;
  formData: () => UseFetchReturn<FormData> & PromiseLike<UseFetchReturn<FormData>>;
}
```

- Details

  The return type of `useFetch`, containing the following properties and methods:

#### data

- Type

  ```typescript
  Ref<T | null>;
  ```

- Details
  The fetch response body on success, may either be JSON or text

#### loading

- Type

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- Details
  Indicates if the request is currently being fetched

#### error

- Type

  ```typescript
  Ref<any>;
  ```

- Details

  Any fetch errors that may have occurred

#### isFinished

- Type

  ```typescript
  Readonly<Ref<boolean>>;
  ```

- Details

  Indicates if the fetch request has finished

#### statusCode

- Type

  ```typescript
  Ref<number | null>;
  ```

- Details

  The statusCode of the HTTP fetch response

#### response

- Type

  ```typescript
  Ref<Response | null>;
  ```

- Details

  The raw fetch response object

#### canAbort

- Type

  ```typescript
  ComputedRef<boolean>;
  ```

- Details

  Indicates if the current request can be aborted

#### aborted

- Type

  ```typescript
  Ref<boolean>;
  ```

- Details

  Indicates if the request was aborted

#### promise$

- Type

  ```typescript
  Readonly<Subjection>;
  ```

- Details

  [fluth](https://fluthjs.github.io/fluth-doc/index.html) stream that pushes latest data to subscribers after each request

#### execute

- Type

  ```typescript
  (throwOnFailed?: boolean) => Promise<any> | void;
  ```

- Details

  - Manually trigger fetch request (default not throwing error)
  - Returns void when `debounce` or `throttle` is set

#### abort

- Type

  ```typescript
  () => void;
  ```

- Details

  Abort the current fetch request

#### cancelRefresh

- Type

  ```typescript
  () => void;
  ```

- Details

  Cancel auto refresh requests

#### clearCache

- Type

  ```typescript
  () => void;
  ```

- Details

  Clear the cache for the current request

#### onFetchResponse

- Type

  ```typescript
  EventHookOn<Response>;
  ```

- Details

  Callback after fetch request completes

#### onFetchError

- Type

  ```typescript
  EventHookOn;
  ```

- Details

  Callback when fetch request encounters an error

#### onFetchFinally

- Type

  ```typescript
  EventHookOn;
  ```

- Details

  Callback when fetch request completes (regardless of success or failure)

#### get

- Type

  ```typescript
  type get: (payload?: MaybeRefOrGetter<unknown>) => UseFetchResult<T>;
  ```

- Details

  Sets fetch request method to `GET` and provides payload. The payload will be parsed into query parameters and appended to the URL. Payload can be reactive data.

#### post

- Type

  ```typescript
  type post: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `POST` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### put

- Type

  ```typescript
  type put: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `PUT` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### delete

- Type

  ```typescript
  type delete: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `DELETE` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### patch

- Type

  ```typescript
  type patch: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `PATCH` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### head

- Type

  ```typescript
  type head: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `HEAD` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### options

- Type

  ```typescript
  type options: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  ```

- Details

  - Sets fetch request method to `OPTIONS` and provides payload. The payload will be included in the request body. Payload can be reactive data.
  - Type can specify the `Content-Type` header, commonly set to json or text

#### json

- Type

  ```typescript
  type json: <JSON = any>() => UseFetchReturn<JSON> & PromiseLike<UseFetchReturn<JSON>>;
  ```

- Details

  Parse response body as JSON format

#### text

- Type

  ```typescript
  type text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  ```

- Details

  Parse response body as text format

#### blob

- Type

  ```typescript
  type blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  ```

- Details

  Parse response body as Blob format

#### arrayBuffer

- Type

  ```typescript
  type arrayBuffer: () => UseFetchReturn<ArrayBuffer> & PromiseLike<UseFetchReturn<ArrayBuffer>>;
  ```

- Details

  Parse response body as ArrayBuffer format

#### formData

- Type

  ```typescript
  type formData: () => UseFetchReturn<FormData> & PromiseLike<UseFetchReturn<FormData>>;
  ```

- Details

  Parse response body as FormData format

## createFetch

- Type

  ```typescript
  interface CreateFetchOptions {
    baseUrl?: MaybeRefOrGetter<string>;
    combination?: "overwrite" | "chain";
    options?: UseFetchOptions;
  }
  declare function createFetch(config?: CreateFetchOptions): typeof useFetch;
  ```

- Details

  Create a `useFetch` with preset configuration

## clearFetchCache

- Type

  ```typescript
  declare function clearFetchCache: () => void
  ```

- Details

  Clear all `useFetch` caches
