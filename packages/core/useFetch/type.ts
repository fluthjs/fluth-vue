import type { EventHookOn, Fn, MaybeRefOrGetter } from "@vueuse/shared";
import type { ComputedRef, Ref } from "vue-demi";
import { Subjection } from "../useFluth";
export type * from "../useFluth";

export type UseFetchResult<T> = UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
export type DataType = "text" | "json" | "blob" | "arrayBuffer" | "formData";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
export type Combination = "overwrite" | "chain";

export interface UseFetchOptions extends RequestInit {
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

export interface UseFetchReturn<T> {
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
   * promise stream
   */
  promise$: Readonly<Subjection>;

  /**
   * Manually call the fetch
   * (default not throwing error)
   */
  execute: (throwOnFailed?: boolean) => Promise<any> | void;

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
  get: (payload?: MaybeRefOrGetter<unknown>) => UseFetchResult<T>;
  post: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  put: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  delete: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  patch: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  head: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;
  options: (payload?: MaybeRefOrGetter<unknown>, type?: string) => UseFetchResult<T>;

  // type
  json: <JSON = any>() => UseFetchReturn<JSON> & PromiseLike<UseFetchReturn<JSON>>;
  text: () => UseFetchReturn<string> & PromiseLike<UseFetchReturn<string>>;
  blob: () => UseFetchReturn<Blob> & PromiseLike<UseFetchReturn<Blob>>;
  arrayBuffer: () => UseFetchReturn<ArrayBuffer> & PromiseLike<UseFetchReturn<ArrayBuffer>>;
  formData: () => UseFetchReturn<FormData> & PromiseLike<UseFetchReturn<FormData>>;
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
