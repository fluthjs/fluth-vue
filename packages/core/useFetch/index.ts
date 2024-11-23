import type { MaybeRefOrGetter, Stoppable } from "@vueuse/shared";
import {
  createEventHook,
  toRef,
  toValue,
  until,
  useTimeoutFn,
  objectPick,
} from "@vueuse/shared";
import {
  computed,
  isRef,
  isReactive,
  readonly,
  ref,
  shallowRef,
  watch,
  nextTick,
} from "vue-demi";
import { debounce, throttle } from "lodash-es";
import { Stream, pipe } from "../useFluth";
import type {
  DataType,
  HttpMethod,
  Combination,
  UseFetchOptions,
  UseFetchReturn,
  BeforeFetchContext,
  CreateFetchOptions,
  InternalConfig,
} from "./type";

export type * from "./type";

const payloadMapping: Record<string, string> = {
  json: "application/json",
  text: "text/plain",
};

const requestInitKeys: (keyof RequestInit)[] = [
  "body",
  "cache",
  "credentials",
  "headers",
  "integrity",
  "keepalive",
  "method",
  "mode",
  "priority",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "window",
];

export function createFetch(config: CreateFetchOptions = {}) {
  const _combination = config.combination || ("chain" as Combination);
  const _options = config.options;

  function useFactoryFetch(
    url: MaybeRefOrGetter<string>,
    options?: UseFetchOptions,
  ) {
    const computedUrl = computed(() => {
      const baseUrl = toValue(config.baseUrl);
      const targetUrl = toValue(url);

      return baseUrl && !isAbsoluteURL(targetUrl)
        ? joinPaths(baseUrl, targetUrl)
        : targetUrl;
    });

    const combinedOptions = {
      ..._options,
      ...options,
      headers: { ..._options?.headers, ...options?.headers },
      beforeFetch: combineCallbacks(
        _combination,
        _options?.beforeFetch,
        options?.beforeFetch,
      ),
      afterFetch: combineCallbacks(
        _combination,
        _options?.afterFetch,
        options?.afterFetch,
      ),
      onFetchError: combineCallbacks(
        _combination,
        _options?.onFetchError,
        options?.onFetchError,
      ),
    };

    return useFetch(computedUrl, combinedOptions);
  }

  return useFactoryFetch as typeof useFetch;
}

export function useFetch<T>(
  url: MaybeRefOrGetter<string>,
  fetchOptions?: UseFetchOptions,
): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>> {
  const supportsAbort = typeof AbortController === "function";

  const options = {
    immediate: true,
    refetch: false,
    condition: true,
    updateDataOnError: false,
    ...fetchOptions,
  };

  const config: InternalConfig = {
    method: "GET",
    type: "text" as DataType,
    payload: undefined as unknown,
  };

  const promise$ = new Stream();

  const {
    fetch = window?.fetch,
    initialData,
    timeout,
    refresh,
    cacheSetting,
  } = options;

  // Event Hooks
  const responseEvent = createEventHook<Response>();
  const errorEvent = createEventHook<any>();
  const finallyEvent = createEventHook<any>();

  const isFinished = ref(false);
  const loading = ref(false);
  const aborted = ref(false);
  const statusCode = ref<number | null>(null);
  const response = shallowRef<Response | null>(null);
  const error = shallowRef<any>(null);
  const data = shallowRef<T | null>(initialData || null);

  const canAbort = computed(() => supportsAbort && loading.value);

  let controller: AbortController | undefined;
  let timer: Stoppable | undefined;
  const REPEAT_REQUEST = "repeat request";

  const abort = () => {
    if (supportsAbort) {
      controller?.abort(REPEAT_REQUEST);
      controller = new AbortController();
      controller.signal.onabort = () => (aborted.value = true);
      fetchOptions = {
        ...fetchOptions,
        signal: controller.signal,
      };
    }
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
    isFinished.value = !isLoading;
  };

  if (timeout) timer = useTimeoutFn(abort, timeout, { immediate: false });

  let retryCount = 0;
  let executeCounter = 0;
  let interval: null | ReturnType<typeof setInterval> = null;
  let cacheKey: string | null = null;

  const execute = async (throwOnFailed = true) => {
    if (!toValue(options.condition)) return Promise.resolve(null);

    abort();

    setLoading(true);
    // cache process
    cacheKey =
      cacheSetting?.cacheResolve?.({ url: toValue(url), ...config }) || null;
    if (cacheKey) {
      const cacheData = useFetch._cache.get(cacheKey);
      if (cacheData !== undefined) {
        data.value = cacheData;
        setLoading(false);
        return Promise.resolve(cacheData);
      }
    }

    error.value = null;
    statusCode.value = null;
    aborted.value = false;

    executeCounter += 1;
    const currentExecuteCounter = executeCounter;

    const defaultFetchOptions: RequestInit = {
      method: config.method,
      headers: {},
    };

    if (config.payload && config.method !== "GET") {
      const headers = headersToObject(defaultFetchOptions.headers) as Record<
        string,
        string
      >;
      const payload = toValue(config.payload);
      // Set the payload to json type only if it's not provided and a literal object is provided and the object is not `formData`
      // The only case we can deduce the content type and `fetch` can't
      if (
        !config.payloadType &&
        payload &&
        Object.getPrototypeOf(payload) === Object.prototype &&
        !(payload instanceof FormData)
      )
        config.payloadType = "json";

      if (config.payloadType)
        headers["Content-Type"] =
          payloadMapping[config.payloadType] ?? config.payloadType;

      defaultFetchOptions.body =
        config.payloadType === "json"
          ? JSON.stringify(payload)
          : (payload as BodyInit);
    }

    let isCanceled = false;
    const context: BeforeFetchContext = {
      url:
        config.method === "GET" && config.payload
          ? addQueryParams(toValue(url), toValue(config.payload))
          : toValue(url),
      options: {
        ...defaultFetchOptions,
        ...fetchOptions,
      },
      cancel: () => {
        isCanceled = true;
      },
    };

    if (options.beforeFetch)
      Object.assign(context, await options.beforeFetch(context));

    if (isCanceled || !fetch) {
      setLoading(false);
      return Promise.resolve(null);
    }

    let responseData: any = null;
    response.value = null;

    if (timer) timer.start();
    return fetch(context.url, {
      ...defaultFetchOptions,
      ...objectPick(context.options, requestInitKeys),
      headers: {
        ...headersToObject(defaultFetchOptions.headers),
        ...headersToObject(context.options?.headers),
      },
    })
      .then(async (fetchResponse) => {
        response.value = fetchResponse;
        statusCode.value = fetchResponse.status;

        responseData = await fetchResponse.clone()[config.type]();

        // see: https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
        if (!fetchResponse.ok) {
          data.value = initialData || null;
          throw new Error(fetchResponse.statusText);
        }

        if (options.afterFetch) {
          ({ data: responseData } = await options.afterFetch({
            data: responseData,
            response: fetchResponse,
          }));
        }
        // reset retry count
        retryCount = 0;
        data.value = responseData;
        if (cacheKey) {
          useFetch._cache.set(cacheKey, responseData);
          if (cacheSetting?.expiration)
            setTimeout(
              () => useFetch._cache.delete(cacheKey || ""),
              cacheSetting.expiration,
            );
        }
        promise$.next(Promise.resolve(responseData));

        responseEvent.trigger(fetchResponse);
        return responseData;
      })
      .catch(async (fetchError) => {
        if (fetchError === REPEAT_REQUEST) {
          console.warn(REPEAT_REQUEST, toValue(url));
          return null;
        }
        let errorData = fetchError.message || fetchError.name;

        if (options.onFetchError) {
          ({ error: errorData, data: responseData } =
            await options.onFetchError({
              data: responseData,
              error: fetchError,
              response: response.value,
            }));
        }

        // retry should not release error
        if (options.retry && retryCount < options.retry) {
          retryCount += 1;
          execute();
          return;
        }

        error.value = errorData;
        if (options.updateDataOnError) data.value = responseData;

        promise$.next(Promise.reject(errorData));
        errorEvent.trigger(errorData);
        if (throwOnFailed) throw errorData;
        return null;
      })
      .finally(() => {
        if (currentExecuteCounter === executeCounter && retryCount === 0)
          setLoading(false);
        if (timer) timer.stop();
        finallyEvent.trigger(null);
      });
  };

  const executeFun = options.debounce
    ? debounce(
        execute,
        typeof options.debounce === "number"
          ? options.debounce
          : options.debounce.wait,
        (typeof options.debounce === "object" && options.debounce.options) ||
          {},
      )
    : options.throttle
      ? throttle(
          execute,
          typeof options.throttle === "number"
            ? options.throttle
            : options.throttle.wait,
          (typeof options.throttle === "object" && options.throttle.options) ||
            {},
        )
      : execute;
  if (options.immediate) nextTick(() => executeFun());

  if (refresh) interval = setInterval(() => executeFun(), refresh);

  // compatible Ref refetch
  const refetch = toRef(options.refetch);

  // watch for url changes
  if (isRef(url) && refetch.value) {
    watch(url, () => execute());
  }

  const shell: UseFetchReturn<T> = {
    isFinished: readonly(isFinished),
    loading: readonly(loading),
    statusCode,
    response,
    error,
    data,
    canAbort,
    aborted,
    promise$: Object.freeze(pipe(promise$)),
    abort,
    execute: executeFun,
    cancelRefresh: () => clearInterval(interval || undefined),
    clearCache: () => useFetch._cache.delete(cacheKey || ""),
    onFetchResponse: responseEvent.on,
    onFetchError: errorEvent.on,
    onFetchFinally: finallyEvent.on,
    // method
    get: setMethod("GET"),
    put: setMethod("PUT"),
    post: setMethod("POST"),
    delete: setMethod("DELETE"),
    patch: setMethod("PATCH"),
    head: setMethod("HEAD"),
    options: setMethod("OPTIONS"),
    // type
    json: setType("json"),
    text: setType("text"),
    blob: setType("blob"),
    arrayBuffer: setType("arrayBuffer"),
    formData: setType("formData"),
  };

  function setMethod(method: HttpMethod) {
    return (payload?: unknown, payloadType?: string) => {
      if (!loading.value) {
        config.method = method;
        config.payload = payload;
        config.payloadType = payloadType;

        // watch for payload changes
        if (
          (isRef(config.payload) || isReactive(config.payload)) &&
          refetch.value
        ) {
          watch(config.payload as any, () => executeFun(), { deep: true });
        }

        return {
          ...shell,
          then(onFulfilled: any, onRejected: any) {
            return waitUntilFinished().then(onFulfilled, onRejected);
          },
        } as any;
      }
      return undefined;
    };
  }

  function waitUntilFinished() {
    return new Promise<UseFetchReturn<T>>((resolve, reject) => {
      until(isFinished)
        .toBe(true)
        .then(() => (error.value ? reject(shell) : resolve(shell)));
    });
  }

  function setType(type: DataType) {
    return () => {
      if (!loading.value) {
        config.type = type;
        return {
          ...shell,
          then(onFulfilled: any, onRejected: any) {
            return waitUntilFinished().then(onFulfilled, onRejected);
          },
        } as any;
      }
      return undefined;
    };
  }

  return {
    ...shell,
    then(onFulfilled, onRejected) {
      return waitUntilFinished().then(onFulfilled, onRejected);
    },
  };
}

useFetch._cache = new Map() as unknown as Map<string, any>;

export function clearFetchCache() {
  useFetch._cache = new Map();
}

function joinPaths(start: string, end: string): string {
  if (!start.endsWith("/") && !end.startsWith("/")) return `${start}/${end}`;

  return `${start}${end}`;
}

function addQueryParams(url: string, params: unknown) {
  if (Object.prototype.toString.call(params) !== "[object Object]") return url;
  const path = url.split("?")[0];
  const query = url.split("?")[1] || "";
  const paramsObj = new URLSearchParams(query);
  Object.keys(params as Record<string, unknown>).forEach((key) =>
    paramsObj.set(key, (params as Record<string, string>)[key]),
  );
  return path + "?" + paramsObj.toString();
}

// A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
function isAbsoluteURL(url: string) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

function headersToObject(headers: HeadersInit | undefined) {
  if (typeof Headers !== "undefined" && headers instanceof Headers)
    return Object.fromEntries(headers.entries());
  return headers;
}

function combineCallbacks<T = any>(
  combination: Combination,
  ...callbacks: (
    | ((ctx: T) => void | Partial<T> | Promise<void | Partial<T>>)
    | undefined
  )[]
) {
  if (combination === "overwrite") {
    // use last callback
    return async (ctx: T) => {
      const callback = callbacks[callbacks.length - 1];
      if (callback) return { ...ctx, ...(await callback(ctx)) };

      return ctx;
    };
  } else {
    // chaining and combine result
    return async (ctx: T) => {
      for (const callback of callbacks) {
        if (callback) ctx = { ...ctx, ...(await callback(ctx)) };
      }

      return ctx;
    };
  }
}
