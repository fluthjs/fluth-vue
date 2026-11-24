import type { EventHookOn, Fn, MaybeRefOrGetter } from "@vueuse/shared";
import type { ComputedRef, Ref } from "vue";
import { Stream, Observable } from "../useFluth";
export type * from "../useFluth";

export type UseFetchResult<T = any> = UseFetchReturn<T> &
  PromiseLike<UseFetchReturn<T>>;
export type DataType = "text" | "json" | "blob" | "arrayBuffer" | "formData";
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
export type Combination = "overwrite" | "chain";

export interface RetryOptions {
  /**
   * Maximum number of retries on failure
   */
  count: number;

  /**
   * Delay in milliseconds before each retry, or a function computing delay per attempt (1-based)
   * @default 0
   */
  delay?: number | ((attempt: number, error: any) => number);
}

export interface FetchCacheStorage {
  get(key: string): any;
  set(key: string, value: any): any;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  readonly size: number;
  keys(): IterableIterator<string>;
}

export interface FetchCacheConfig {
  /**
   * Maximum number of entries in the default global LRU cache
   * @default 100
   */
  maxSize?: number;
}

export interface FetchCacheSetting {
  /**
   * Cache entry TTL in milliseconds
   */
  expiration?: number;

  /**
   * Custom cache key resolver; return empty/falsy string to skip caching
   */
  cacheResolve?: (config: InternalConfig & { url: string }) => string;

  /**
   * Custom cache storage (e.g. per-request Map in SSR to avoid cross-request cache leakage)
   */
  storage?: FetchCacheStorage;

  /**
   * Maximum cache size override for this storage
   */
  maxSize?: number;
}

export interface UseFetchOptions<T = any> extends RequestInit {
  /**
   * Initial data before the request finished
   *
   * @default null
   */
  initialData?: T;

  /**
   * Will automatically run fetch when `useFetch` is used
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Execute fetch only when condition is true
   * @default true
   */
  condition?:
    | MaybeRefOrGetter<boolean>
    | Observable<boolean>
    | Stream<boolean>
    | (() => boolean);

  /**
   * Will automatically refetch when:
   * - the URL is changed if the URL is a ref, getter, or stream/observable
   * - the payload is changed if the payload is a ref, reactive, getter, or stream/observable
   *
   * @default false
   */
  refetch?: MaybeRefOrGetter<boolean>;

  /**
   * Auto refetch interval in millisecond
   * @default undefined
   */
  refresh?: number;

  /**
   * Retry count or retry config (with optional backoff delay) when fetch errors
   * @default 0
   */
  retry?: number | RetryOptions;

  /**
   * Allow caching the request result and reusing it if cacheResolve returns the same key
   *
   * @default undefined
   */
  cacheSetting?: FetchCacheSetting;

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
   * Timeout for aborting a request after number of milliseconds
   * `0` means use browser default
   *
   * @default undefined
   */
  timeout?: number;

  /**
   * Abort in-flight requests when the enclosing Vue EffectScope is disposed.
   * Timers, watchers, and streaming readers are always cleaned up on dispose.
   *
   * @default false
   */
  abortOnUnmount?: boolean;

  /**
   * Fetch function
   */
  fetch?: typeof globalThis.fetch;

  /**
   * Allow updating the `data` ref when fetch errors whenever provided, or mutated in the `onFetchError` callback
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
    ctx: AfterFetchContext<T>,
  ) =>
    | Promise<Partial<AfterFetchContext<T>> | void>
    | Partial<AfterFetchContext<T>>
    | void;

  /**
   * Will run immediately after the fetch request fails terminally (after retries are exhausted).
   */
  onFetchError?: (
    ctx: OnFetchErrorContext<T>,
  ) =>
    | Promise<Partial<OnFetchErrorContext<T>> | void>
    | Partial<OnFetchErrorContext<T>>
    | void;
}

export interface UseFetchReturn<T = any> {
  /**
   * The fetch response body on success, may either be JSON or text
   */
  data: Ref<T | null>;

  /**
   * Indicates if the request is currently being fetched.
   */
  loading: Readonly<Ref<boolean>>;

  /**
   * Any fetch errors that may have occurred
   */
  error: Ref<any>;

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
   * Indicates if the fetch request is able to be aborted
   */
  canAbort: ComputedRef<boolean>;

  /**
   * Indicates if the fetch request was aborted
   */
  aborted: Ref<boolean>;

  /**
   * Promise stream
   */
  promise$: Stream<T | undefined>;

  /**
   * Manually call the fetch.
   * Throws on failure by default (`throwOnFailed = true`) unless `debounce` or `throttle` is enabled (which returns `void`).
   */
  execute: (throwOnFailed?: boolean) => Promise<T | null> | void;

  /**
   * Abort the fetch request
   */
  abort: (message?: string) => void;

  /**
   * Cancel refresh request
   */
  cancelRefresh: Fn;

  /**
   * Clear current fetch cache entry
   */
  clearCache: Fn;

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

  // methods
  get: (
    payload?: MaybeRefOrGetter<unknown> | Stream<unknown> | Observable<unknown>,
  ) => UseFetchResult<T>;
  post: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  put: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  delete: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  patch: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  head: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;
  options: (
    payload?: MaybeRefOrGetter<unknown> | Observable<unknown> | Stream<unknown>,
    type?: string,
  ) => UseFetchResult<T>;

  // type
  json: <JSON = any>() => UseFetchReturn<JSON> &
    PromiseLike<UseFetchReturn<JSON>>;
  text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  arrayBuffer: () => UseFetchReturn<ArrayBuffer> &
    PromiseLike<UseFetchReturn<ArrayBuffer>>;
  formData: () => UseFetchReturn<FormData> &
    PromiseLike<UseFetchReturn<FormData>>;
}

export interface BeforeFetchContext {
  /**
   * The computed url of the current request
   */
  url: string;

  /**
   * The request options of the current request
   */
  options: UseFetchOptions;

  /**
   * Cancels the current request
   */
  cancel: Fn;
}

export interface AfterFetchContext<T = any> {
  response: Response;

  data: T | null;
}

export interface OnFetchErrorContext<T = any, E = any> {
  error: E;

  data: T | null;

  response: Response | null;
}

export interface CreateFetchOptions {
  /**
   * The base URL that will be prefixed to all urls unless urls are absolute
   */
  baseUrl?: MaybeRefOrGetter<string>;

  /**
   * Determine the inherit behavior for beforeFetch, afterFetch, onFetchError
   * @default 'chain'
   */
  combination?: Combination;

  /**
   * Default Options for the useFetch function
   */
  options?: UseFetchOptions;
}

export interface InternalConfig {
  method: HttpMethod;
  type: DataType;
  payload: unknown;
  payloadType?: string;
}
