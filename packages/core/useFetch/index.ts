import type { MaybeRefOrGetter } from "@vueuse/shared";
import {
  createEventHook,
  toRef,
  toValue,
  until,
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
  getCurrentScope,
  onScopeDispose,
} from "vue";
import { debounce, throttle } from "lodash-es";
import { $, Observable, Stream, PromiseStatus } from "../useFluth";
import type {
  AfterFetchContext,
  DataType,
  FetchCacheConfig,
  FetchCacheStorage,
  HttpMethod,
  Combination,
  OnFetchErrorContext,
  RetryOptions,
  UseFetchOptions,
  UseFetchResult,
  UseFetchReturn,
  BeforeFetchContext,
  CreateFetchOptions,
  InternalConfig,
} from "./type";
import {
  joinPaths,
  isAbsoluteURL,
  headersToObject,
  addQueryParams,
  combineCallbacks,
  getValue,
} from "./utils";

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

const CACHE_ENTRY_TAG = Symbol("fluth-vue:fetch-cache-entry");
const DEFAULT_CACHE_MAX_SIZE = 100;

interface InternalCacheEntry<T = any> {
  [CACHE_ENTRY_TAG]: true;
  data: T;
  expiresAt?: number;
  timer?: ReturnType<typeof setTimeout>;
}

const globalCacheConfig = {
  maxSize: DEFAULT_CACHE_MAX_SIZE,
};

function isInternalCacheEntry(value: unknown): value is InternalCacheEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    CACHE_ENTRY_TAG in value &&
    (value as InternalCacheEntry)[CACHE_ENTRY_TAG] === true
  );
}

function deleteCacheEntry(storage: FetchCacheStorage, key: string): boolean {
  if (!storage.has(key)) return false;
  const existing = storage.get(key);
  if (isInternalCacheEntry(existing) && existing.timer !== undefined) {
    clearTimeout(existing.timer);
  }
  return storage.delete(key);
}

function clearCacheStorage(storage: FetchCacheStorage): void {
  for (const key of Array.from(storage.keys())) {
    deleteCacheEntry(storage, key);
  }
  storage.clear();
}

function evictExcessEntries(storage: FetchCacheStorage, maxSize: number): void {
  const limit = Math.max(0, maxSize);
  while (storage.size > limit) {
    const oldestKey = storage.keys().next().value;
    if (oldestKey === undefined) break;
    deleteCacheEntry(storage, oldestKey);
  }
}

function getCacheEntry(
  storage: FetchCacheStorage,
  key: string,
): { hit: true; data: any } | { hit: false } {
  if (!storage.has(key)) return { hit: false };
  const raw = storage.get(key);

  if (isInternalCacheEntry(raw)) {
    if (raw.expiresAt !== undefined && Date.now() >= raw.expiresAt) {
      deleteCacheEntry(storage, key);
      return { hit: false };
    }
    // Refresh LRU order on hit
    storage.delete(key);
    storage.set(key, raw);
    return { hit: true, data: raw.data };
  }

  storage.delete(key);
  storage.set(key, raw);
  return { hit: true, data: raw };
}

function setCacheEntry(
  storage: FetchCacheStorage,
  key: string,
  data: any,
  expiration?: number,
  maxSize?: number,
): void {
  const effectiveMaxSize = maxSize ?? globalCacheConfig.maxSize;
  deleteCacheEntry(storage, key);

  if (effectiveMaxSize <= 0) return;

  evictExcessEntries(storage, effectiveMaxSize - 1);

  const entry: InternalCacheEntry = {
    [CACHE_ENTRY_TAG]: true,
    data,
    expiresAt:
      expiration && expiration > 0 ? Date.now() + expiration : undefined,
  };

  if (expiration && expiration > 0) {
    entry.timer = setTimeout(() => {
      if (storage.get(key) === entry) {
        storage.delete(key);
      }
    }, expiration);
    (entry.timer as { unref?: () => void }).unref?.();
  }

  storage.set(key, entry);
}

function normalizeRetry(retryOption?: number | RetryOptions): {
  count: number;
  delay: number | ((attempt: number, error: any) => number);
} {
  if (typeof retryOption === "number") {
    return { count: Math.max(0, Math.floor(retryOption)), delay: 0 };
  }
  if (retryOption && typeof retryOption === "object") {
    return {
      count: Math.max(0, Math.floor(retryOption.count)),
      delay: retryOption.delay ?? 0,
    };
  }
  return { count: 0, delay: 0 };
}

function watchReactiveSource(
  source: unknown,
  onTrigger: () => void,
  deep = false,
): (() => void) | null {
  // Check Observable/Stream before isRef because enhanced streams mimic Ref via __v_isRef
  if (source instanceof Observable || source instanceof Stream) {
    const subscription = source.then(() => onTrigger());
    return () => subscription.unsubscribe();
  }
  if (typeof source === "function") {
    return watch(source as () => unknown, () => onTrigger(), { deep });
  }
  if (isRef(source) || isReactive(source)) {
    return watch(source as any, () => onTrigger(), { deep });
  }
  return null;
}

type AbortKind = "manual" | "repeat" | "timeout" | "unmount" | null;

interface ActiveRequest {
  id: number;
  controller?: AbortController;
  abortKind: AbortKind;
  abortMessage?: string;
  timeoutId?: ReturnType<typeof setTimeout>;
  retryTimerId?: ReturnType<typeof setTimeout>;
  cancelRetryWait?: () => void;
  reader?: ReadableStreamDefaultReader<Uint8Array>;
  streamDisposed?: boolean;
}

// Helper prevents TypeScript control-flow narrowing of req.abortKind across async boundaries
const getAbortKind = (req: ActiveRequest): AbortKind => req.abortKind;

export function createFetch(config: CreateFetchOptions = {}) {
  const _combination = config.combination || ("chain" as Combination);
  const _options = config.options;

  function useFactoryFetch<T = any>(
    url: MaybeRefOrGetter<string> | Observable<string> | Stream<string>,
    options?: UseFetchOptions<T>,
  ): UseFetchResult<T> {
    const computedUrl = computed(() => {
      const baseUrl = toValue(config.baseUrl);
      const targetUrl = String(getValue(url) ?? "");

      return baseUrl && !isAbsoluteURL(targetUrl)
        ? joinPaths(baseUrl, targetUrl)
        : targetUrl;
    });

    const hasHeaders = Boolean(_options?.headers || options?.headers);
    const hasCacheSetting = Boolean(
      _options?.cacheSetting || options?.cacheSetting,
    );
    const combinedOptions: UseFetchOptions<T> = {
      ..._options,
      ...options,
      ...(hasHeaders
        ? {
            headers: {
              ...headersToObject(_options?.headers),
              ...headersToObject(options?.headers),
            },
          }
        : {}),
      ...(hasCacheSetting
        ? {
            cacheSetting: {
              ..._options?.cacheSetting,
              ...options?.cacheSetting,
            },
          }
        : {}),
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

    return useFetch<T>(computedUrl, combinedOptions);
  }

  return useFactoryFetch as typeof useFetch;
}

export function useFetch<T = any>(
  url: MaybeRefOrGetter<string> | Observable<string> | Stream<string>,
  fetchOptions?: UseFetchOptions<T>,
): UseFetchResult<T> {
  const supportsAbort = typeof AbortController === "function";

  const baseFetchOptions = fetchOptions ? { ...fetchOptions } : undefined;
  const externalSignal = baseFetchOptions?.signal ?? undefined;

  const options = {
    immediate: true,
    refetch: false,
    condition: true,
    updateDataOnError: false,
    abortOnUnmount: false,
    ...baseFetchOptions,
  };

  if (options.debounce && options.throttle) {
    console.warn(
      "[useFetch] Both 'debounce' and 'throttle' options were provided; 'debounce' takes precedence.",
    );
  }

  const config: InternalConfig = {
    method: (baseFetchOptions?.method?.toUpperCase() as HttpMethod) || "GET",
    type: "text" as DataType,
    payload: undefined as unknown,
  };

  const promise$ = $<T | undefined>(baseFetchOptions?.initialData ?? undefined);

  const { initialData, timeout, refresh, cacheSetting } = options;
  const retryConfig = normalizeRetry(options.retry);

  const resolveFetch = (): typeof globalThis.fetch | undefined => {
    if (options.fetch) return options.fetch;
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
      return (...args) => window.fetch(...args);
    }
    if (
      typeof globalThis !== "undefined" &&
      typeof globalThis.fetch === "function"
    ) {
      return (...args) => globalThis.fetch(...args);
    }
    return undefined;
  };

  const getCacheStorage = (): FetchCacheStorage =>
    cacheSetting?.storage ?? useFetch._cache;

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
  const data = shallowRef<T | null>(initialData ?? null);

  const canAbort = computed(() => supportsAbort && loading.value);

  const REPEAT_REQUEST = "repeat request";
  const TIME_OUT = "fetch timeout";

  let executeCounter = 0;
  let activeRequest: ActiveRequest | null = null;
  let lastController: AbortController | undefined;
  let interval: null | ReturnType<typeof setInterval> = null;
  let lastCacheKey: string | null = null;
  let stopUrlWatch: (() => void) | null = null;
  let stopPayloadWatch: (() => void) | null = null;
  let isDisposed = false;

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
    isFinished.value = !isLoading;
  };

  const clearRequestTimers = (req: ActiveRequest) => {
    if (req.timeoutId !== undefined) {
      clearTimeout(req.timeoutId);
      req.timeoutId = undefined;
    }
    if (req.retryTimerId !== undefined) {
      clearTimeout(req.retryTimerId);
      req.retryTimerId = undefined;
    }
  };

  const abortRequest = (
    req: ActiveRequest | null,
    kind: Exclude<AbortKind, null>,
    message?: string,
  ) => {
    if (!req) return;
    if (!req.abortKind) {
      req.abortKind = kind;
      req.abortMessage = message;
    }
    clearRequestTimers(req);
    req.cancelRetryWait?.();

    if (req.reader) {
      const reader = req.reader;
      req.reader = undefined;
      void reader.cancel().catch(() => undefined);
    }

    if (
      (kind === "manual" || kind === "timeout" || kind === "unmount") &&
      req.id === executeCounter
    ) {
      aborted.value = true;
    }

    if (supportsAbort && req.controller && !req.controller.signal.aborted) {
      const reason =
        message ??
        (kind === "repeat"
          ? REPEAT_REQUEST
          : kind === "timeout"
            ? TIME_OUT
            : undefined);
      req.controller.abort(reason);
    }
  };

  const abort = (message?: string) => {
    if (!supportsAbort) return;
    if (activeRequest) {
      abortRequest(activeRequest, "manual", message);
    } else if (lastController && !lastController.signal.aborted) {
      lastController.abort(message);
      aborted.value = true;
    }
  };

  const waitRetryDelay = (
    req: ActiveRequest,
    delayMs: number,
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (shouldContinue: boolean) => {
        if (settled) return;
        settled = true;
        if (req.retryTimerId !== undefined) {
          clearTimeout(req.retryTimerId);
          req.retryTimerId = undefined;
        }
        req.cancelRetryWait = undefined;
        resolve(shouldContinue);
      };

      req.cancelRetryWait = () => finish(false);
      req.retryTimerId = setTimeout(() => finish(true), delayMs);
    });
  };

  const attachForwardSignal = (
    sourceSignal: AbortSignal | null | undefined,
    targetController: AbortController | undefined,
    req: ActiveRequest,
    currentExecuteCounter: number,
  ): (() => void) | null => {
    if (!sourceSignal || !targetController) return null;
    if (sourceSignal.aborted) {
      if (!req.abortKind) req.abortKind = "manual";
      if (currentExecuteCounter === executeCounter) aborted.value = true;
      if (!targetController.signal.aborted) {
        targetController.abort(sourceSignal.reason);
      }
      return null;
    }

    const onAbort = () => {
      if (!req.abortKind) req.abortKind = "manual";
      if (currentExecuteCounter === executeCounter) aborted.value = true;
      req.cancelRetryWait?.();
      if (!targetController.signal.aborted) {
        targetController.abort(sourceSignal.reason);
      }
    };

    sourceSignal.addEventListener("abort", onAbort, { once: true });
    return () => sourceSignal.removeEventListener("abort", onAbort);
  };

  const createAbortError = (req: ActiveRequest, abortKind: AbortKind) =>
    new Error(
      req.abortMessage ||
        (abortKind === "timeout" ? TIME_OUT : "The operation was aborted."),
    );

  const emitNdjsonLines = (lines: string[]) => {
    for (const line of lines) {
      if (line.trim()) {
        try {
          const jsonObj = JSON.parse(line);
          promise$.next(jsonObj as T);
        } catch (e) {
          console.error(e);
          promise$.next(line as T);
        }
      }
    }
  };

  const runAttempt = async (
    attempt: number,
    currentExecuteCounter: number,
    throwOnFailed: boolean,
    req: ActiveRequest,
    currentCacheKey: string | null,
  ): Promise<T | null> => {
    const attemptController = supportsAbort ? new AbortController() : undefined;
    req.controller = attemptController;
    lastController = attemptController;

    const cleanupFns: (() => void)[] = [];
    if (attemptController) {
      const onControllerAbort = () => {
        if (
          req.id === executeCounter &&
          req.abortKind !== "repeat" &&
          !req.streamDisposed
        ) {
          aborted.value = true;
        }
      };
      attemptController.signal.addEventListener("abort", onControllerAbort, {
        once: true,
      });
      cleanupFns.push(() =>
        attemptController.signal.removeEventListener(
          "abort",
          onControllerAbort,
        ),
      );
    }

    const externalCleanup = attachForwardSignal(
      externalSignal,
      attemptController,
      req,
      currentExecuteCounter,
    );
    if (externalCleanup) cleanupFns.push(externalCleanup);

    const defaultFetchOptions: RequestInit = {
      method: config.method,
      headers: {},
    };

    let resolvedPayloadType = config.payloadType;
    if (config.payload !== undefined && config.method !== "GET") {
      const headers = headersToObject(defaultFetchOptions.headers);
      const payload = getValue(config.payload);
      // Set the payload to json type only if it's not provided and a literal object is provided and the object is not `FormData`
      if (
        !resolvedPayloadType &&
        payload &&
        Object.getPrototypeOf(payload) === Object.prototype &&
        !(payload instanceof FormData)
      ) {
        resolvedPayloadType = "json";
      }

      if (resolvedPayloadType) {
        headers["Content-Type"] =
          payloadMapping[resolvedPayloadType] ?? resolvedPayloadType;
      }

      defaultFetchOptions.headers = headers;
      if (payload !== undefined) {
        defaultFetchOptions.body =
          resolvedPayloadType === "json"
            ? JSON.stringify(payload)
            : (payload as BodyInit);
      }
    }

    const resolvedUrl = String(getValue(url) ?? "");
    let isCanceled = false;
    const context: BeforeFetchContext = {
      url:
        config.method === "GET" && config.payload !== undefined
          ? addQueryParams(resolvedUrl, getValue(config.payload))
          : resolvedUrl,
      options: {
        ...baseFetchOptions,
        ...defaultFetchOptions,
        headers: {
          ...headersToObject(defaultFetchOptions.headers),
          ...headersToObject(baseFetchOptions?.headers),
        },
        ...(attemptController ? { signal: attemptController.signal } : {}),
      },
      cancel: () => {
        isCanceled = true;
      },
    };

    let responseData: any = null;
    response.value = null;

    let attemptTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const clearAttemptTimeout = () => {
      if (attemptTimeoutId !== undefined) {
        clearTimeout(attemptTimeoutId);
        if (req.timeoutId === attemptTimeoutId) {
          req.timeoutId = undefined;
        }
        attemptTimeoutId = undefined;
      }
    };

    let isRetrying = false;
    let beforeFetchFailed = false;
    let skipFinallyEvent = false;

    try {
      if (options.beforeFetch) {
        try {
          Object.assign(context, await options.beforeFetch(context));
        } catch (beforeFetchError) {
          beforeFetchFailed = true;
          throw beforeFetchError;
        }
      }

      if (
        currentExecuteCounter !== executeCounter ||
        getAbortKind(req) === "repeat" ||
        getAbortKind(req) === "unmount"
      ) {
        skipFinallyEvent = true;
        return null;
      }

      const fetchFn = resolveFetch();
      if (isCanceled || !fetchFn) {
        skipFinallyEvent = true;
        return null;
      }

      if (
        context.options?.signal &&
        context.options.signal !== attemptController?.signal &&
        context.options.signal !== externalSignal
      ) {
        const extraCleanup = attachForwardSignal(
          context.options.signal,
          attemptController,
          req,
          currentExecuteCounter,
        );
        if (extraCleanup) cleanupFns.push(extraCleanup);
      }

      if (timeout && timeout > 0) {
        attemptTimeoutId = setTimeout(() => {
          if (
            req.id === executeCounter &&
            (!attemptController || !attemptController.signal.aborted)
          ) {
            abortRequest(req, "timeout", TIME_OUT);
          }
        }, timeout);
        req.timeoutId = attemptTimeoutId;
      }

      promise$.status = PromiseStatus.PENDING;

      const preFetchAbortKind = getAbortKind(req);
      if (preFetchAbortKind === "unmount") {
        return null;
      }
      if (preFetchAbortKind) {
        throw createAbortError(req, preFetchAbortKind);
      }

      const requestInit: RequestInit = {
        ...defaultFetchOptions,
        ...objectPick(context.options, requestInitKeys),
        headers: {
          ...headersToObject(defaultFetchOptions.headers),
          ...headersToObject(context.options?.headers),
        },
      };
      if (attemptController) {
        requestInit.signal = attemptController.signal;
      }

      const fetchResponse = await fetchFn(context.url, requestInit);

      if (
        currentExecuteCounter !== executeCounter ||
        getAbortKind(req) === "repeat" ||
        getAbortKind(req) === "unmount"
      ) {
        return null;
      }

      response.value = fetchResponse;
      statusCode.value = fetchResponse.status;

      // Check response.ok before consuming stream bodies to avoid pushing error responses to promise$
      if (!fetchResponse.ok) {
        try {
          responseData = await fetchResponse.clone()[config.type]();
        } catch {
          responseData = null;
        }
        if (currentExecuteCounter !== executeCounter) return null;
        data.value = initialData ?? null;
        throw new Error(
          fetchResponse.statusText || `HTTP Error ${fetchResponse.status}`,
        );
      }

      const contentType =
        fetchResponse.headers.get("Content-Type")?.toLowerCase() || "";
      const responseBody = fetchResponse.body;
      const hasReadableBody =
        responseBody != null &&
        typeof (responseBody as any).getReader === "function";
      const isSSEStream =
        contentType.includes("text/event-stream") && hasReadableBody;
      const isNDJSONStream =
        (contentType.includes("application/x-ndjson") ||
          contentType.includes("application/ndjson")) &&
        hasReadableBody;

      // Handle stream response directly without cloning to avoid ReadableStream.tee() OOM
      if ((isSSEStream || isNDJSONStream) && responseBody) {
        const reader = responseBody.getReader();
        req.reader = reader;
        const decoder = new TextDecoder();
        let received = "";
        let buffer = "";

        const checkStreamStop = async (): Promise<"continue" | "silent"> => {
          const abortKind = getAbortKind(req);
          if (
            currentExecuteCounter !== executeCounter ||
            abortKind === "repeat" ||
            abortKind === "unmount" ||
            (req.streamDisposed && !options.abortOnUnmount)
          ) {
            await reader.cancel().catch(() => undefined);
            return "silent";
          }
          if (abortKind) {
            await reader.cancel().catch(() => undefined);
            throw createAbortError(req, abortKind);
          }
          return "continue";
        };

        try {
          while (true) {
            if ((await checkStreamStop()) === "silent") return null;

            const { done, value } = await reader.read();

            if ((await checkStreamStop()) === "silent") return null;

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            received += chunk;

            if (isNDJSONStream) {
              buffer += chunk;
              const lines = buffer.split(/\r?\n/);
              buffer = lines.pop() || "";
              emitNdjsonLines(lines);
            } else {
              promise$.next(chunk as T);
            }
          }

          // Flush trailing multi-byte UTF-8 sequence buffered in TextDecoder
          const rest = decoder.decode();
          if (rest) {
            received += rest;
            if (isNDJSONStream) {
              buffer += rest;
            } else {
              promise$.next(rest as T);
            }
          }

          // Handle any remaining content in buffer for NDJSON
          if (isNDJSONStream && buffer.trim()) {
            emitNdjsonLines(buffer.split(/\r?\n/));
          }

          responseData = received;
        } finally {
          if (req.reader === reader) {
            req.reader = undefined;
          }
          try {
            reader.releaseLock();
          } catch {
            // Lock may already be released after cancel
          }
        }
      } else {
        responseData = await fetchResponse.clone()[config.type]();
      }

      if (currentExecuteCounter !== executeCounter) return null;

      if (options.afterFetch) {
        const afterCtx: AfterFetchContext<T> = {
          data: responseData,
          response: fetchResponse,
        };
        const afterResult = await options.afterFetch(afterCtx);
        if (currentExecuteCounter !== executeCounter) return null;
        responseData =
          afterResult && "data" in afterResult
            ? afterResult.data
            : afterCtx.data;
      }

      data.value = responseData;
      if (currentCacheKey && !isSSEStream && !isNDJSONStream) {
        setCacheEntry(
          getCacheStorage(),
          currentCacheKey,
          responseData,
          cacheSetting?.expiration,
          cacheSetting?.storage ? cacheSetting.maxSize : undefined,
        );
      }

      if (!isSSEStream && !isNDJSONStream) {
        promise$.next(Promise.resolve(responseData));
      }

      responseEvent.trigger(fetchResponse);
      return responseData;
    } catch (fetchError: any) {
      // Clear current attempt's timeout before any retry backoff wait
      clearAttemptTimeout();

      // Request cancelled by a newer execute: newer request owns error / retry / promise$
      const currentAbortKind = getAbortKind(req);
      const isRepeatCanceled =
        currentAbortKind === "repeat" ||
        fetchError === REPEAT_REQUEST ||
        (attemptController?.signal.aborted &&
          attemptController.signal.reason === REPEAT_REQUEST);
      if (isRepeatCanceled) {
        console.warn(REPEAT_REQUEST, getValue(url));
        return null;
      }

      if (currentExecuteCounter !== executeCounter) {
        return null;
      }

      // Unmount cancellation is silent (no error write / no global onFetchError toast)
      if (
        currentAbortKind === "unmount" ||
        (req.streamDisposed && !options.abortOnUnmount)
      ) {
        return null;
      }

      // Retry state machine: skip retry for beforeFetch error, manual abort, or disposed scope
      const canRetry =
        !beforeFetchFailed &&
        currentAbortKind !== "manual" &&
        !isDisposed &&
        attempt < retryConfig.count;

      if (canRetry) {
        const nextAttempt = attempt + 1;
        const delayMs =
          typeof retryConfig.delay === "function"
            ? retryConfig.delay(nextAttempt, fetchError)
            : retryConfig.delay;

        let shouldContinue = true;
        if (delayMs && delayMs > 0) {
          shouldContinue = await waitRetryDelay(req, delayMs);
          const postWaitAbortKind = getAbortKind(req);
          if (
            currentExecuteCounter !== executeCounter ||
            postWaitAbortKind === "repeat" ||
            postWaitAbortKind === "unmount" ||
            isDisposed
          ) {
            return null;
          }
        }

        // Re-check abort state after backoff wait to catch manual abort during delay
        const retryAbortKind = getAbortKind(req);
        if (
          shouldContinue &&
          currentExecuteCounter === executeCounter &&
          !isDisposed &&
          retryAbortKind !== "manual" &&
          retryAbortKind !== "unmount" &&
          retryAbortKind !== "repeat"
        ) {
          // Reset per-attempt abort state (e.g. from timeout) before next attempt
          req.abortKind = null;
          req.abortMessage = undefined;
          aborted.value = false;
          isRetrying = true;
          return runAttempt(
            nextAttempt,
            currentExecuteCounter,
            throwOnFailed,
            req,
            currentCacheKey,
          );
        }
      }

      let errorData = fetchError?.message || fetchError?.name || fetchError;

      if (options.onFetchError) {
        const errorCtx: OnFetchErrorContext<T> = {
          data: responseData,
          error: fetchError,
          response: response.value,
        };
        const errorResult = await options.onFetchError(errorCtx);
        if (currentExecuteCounter !== executeCounter) return null;
        if (errorResult) {
          // Treat returning the original fetchError reference as unmodified so error.value stays consistent
          if ("error" in errorResult && errorResult.error !== fetchError) {
            errorData = errorResult.error;
          } else if (errorCtx.error !== fetchError) {
            errorData = errorCtx.error;
          }
          responseData =
            "data" in errorResult ? errorResult.data : errorCtx.data;
        } else {
          if (errorCtx.error !== fetchError) {
            errorData = errorCtx.error;
          }
          responseData = errorCtx.data;
        }
      }

      error.value = errorData;
      if (options.updateDataOnError) data.value = responseData;

      promise$.next(Promise.reject(errorData));
      errorEvent.trigger(errorData);
      if (throwOnFailed) throw errorData;
      return null;
    } finally {
      clearAttemptTimeout();
      cleanupFns.forEach((fn) => fn());

      if (!isRetrying && currentExecuteCounter === executeCounter) {
        if (activeRequest === req) {
          activeRequest = null;
        }
        setLoading(false);
        if (!skipFinallyEvent) {
          finallyEvent.trigger(null);
        }
      }
    }
  };

  const executeCore = async (throwOnFailed = true): Promise<T | null> => {
    const conditionResult = getValue(options.condition);
    if (!conditionResult) return null;

    abortRequest(activeRequest, "repeat", REPEAT_REQUEST);

    executeCounter += 1;
    const currentExecuteCounter = executeCounter;

    const resolvedUrl = String(getValue(url) ?? "");
    const currentCacheKey =
      cacheSetting?.cacheResolve?.({ url: resolvedUrl, ...config }) || null;
    lastCacheKey = currentCacheKey;

    if (currentCacheKey) {
      const cached = getCacheEntry(getCacheStorage(), currentCacheKey);
      if (cached.hit) {
        activeRequest = null;
        data.value = cached.data;
        error.value = null;
        aborted.value = false;
        setLoading(false);
        promise$.next(cached.data);
        return cached.data;
      }
    }

    setLoading(true);
    error.value = null;
    statusCode.value = null;
    aborted.value = false;

    const req: ActiveRequest = {
      id: currentExecuteCounter,
      abortKind: null,
    };
    activeRequest = req;

    return runAttempt(
      0,
      currentExecuteCounter,
      throwOnFailed,
      req,
      currentCacheKey,
    );
  };

  const runAutoExecute = () => {
    void executeCore(false).catch(() => undefined);
  };

  const debouncedOrThrottled = options.debounce
    ? debounce(
        runAutoExecute,
        typeof options.debounce === "number"
          ? options.debounce
          : options.debounce.wait,
        (typeof options.debounce === "object" && options.debounce.options) ||
          {},
      )
    : options.throttle
      ? throttle(
          runAutoExecute,
          typeof options.throttle === "number"
            ? options.throttle
            : options.throttle.wait,
          (typeof options.throttle === "object" && options.throttle.options) ||
            {},
        )
      : null;

  const executeFun = debouncedOrThrottled
    ? (): void => {
        debouncedOrThrottled();
      }
    : executeCore;

  const triggerAutoExecute = () => {
    if (isDisposed) return;
    if (debouncedOrThrottled) {
      debouncedOrThrottled();
    } else {
      runAutoExecute();
    }
  };

  if (options.immediate) {
    nextTick(() => {
      if (!isDisposed) triggerAutoExecute();
    });
  }

  if (refresh) {
    interval = setInterval(() => triggerAutoExecute(), refresh);
  }

  // Compatible Ref / Getter / boolean refetch
  const refetch = toRef(options.refetch);
  const shouldWatchRefetch =
    isRef(options.refetch) ||
    typeof options.refetch === "function" ||
    Boolean(options.refetch);

  if (shouldWatchRefetch) {
    stopUrlWatch = watchReactiveSource(url, () => {
      if (refetch.value) triggerAutoExecute();
    });
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      isDisposed = true;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      debouncedOrThrottled?.cancel();
      stopUrlWatch?.();
      stopUrlWatch = null;
      stopPayloadWatch?.();
      stopPayloadWatch = null;

      if (activeRequest) {
        // Always cancel pending retry backoff timers on dispose
        if (activeRequest.retryTimerId !== undefined) {
          clearTimeout(activeRequest.retryTimerId);
          activeRequest.retryTimerId = undefined;
        }
        activeRequest.cancelRetryWait?.();

        if (activeRequest.reader) {
          activeRequest.streamDisposed = true;
          clearRequestTimers(activeRequest);
          const reader = activeRequest.reader;
          activeRequest.reader = undefined;
          void reader.cancel().catch(() => undefined);
        }
        if (options.abortOnUnmount) {
          abortRequest(activeRequest, "unmount");
        }
      }
    });
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
    promise$,
    abort,
    execute: executeFun,
    cancelRefresh: () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
    clearCache: () => {
      const targetKey =
        lastCacheKey ||
        cacheSetting?.cacheResolve?.({
          url: String(getValue(url) ?? ""),
          ...config,
        }) ||
        null;
      if (targetKey) {
        deleteCacheEntry(getCacheStorage(), targetKey);
      }
    },
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

  function createShellResult(): UseFetchResult<T> {
    return {
      ...shell,
      then(onFulfilled: any, onRejected: any) {
        return waitUntilFinished().then(onFulfilled, onRejected);
      },
    } as UseFetchResult<T>;
  }

  function setMethod(method: HttpMethod) {
    return (payload?: unknown, payloadType?: string) => {
      if (!loading.value) {
        config.method = method;
        config.payload = payload;
        config.payloadType = payloadType;

        stopPayloadWatch?.();
        stopPayloadWatch = null;

        if (shouldWatchRefetch) {
          stopPayloadWatch = watchReactiveSource(
            config.payload,
            () => {
              if (refetch.value) triggerAutoExecute();
            },
            true,
          );
        }
      } else {
        console.warn(
          `[useFetch] Ignored ${method} call while request is loading:`,
          getValue(url),
        );
      }
      return createShellResult() as any;
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
      } else {
        console.warn(
          `[useFetch] Ignored .${type}() call while request is loading:`,
          getValue(url),
        );
      }
      return createShellResult() as any;
    };
  }

  return createShellResult();
}

useFetch._cache = new Map() as unknown as Map<string, any>;

export function configureFetchCache(config: FetchCacheConfig = {}) {
  if (config.maxSize !== undefined) {
    if (typeof config.maxSize !== "number" || Number.isNaN(config.maxSize)) {
      console.warn(
        "[useFetch] Ignored invalid configureFetchCache maxSize:",
        config.maxSize,
      );
      return;
    }
    globalCacheConfig.maxSize = Number.isFinite(config.maxSize)
      ? Math.max(0, Math.floor(config.maxSize))
      : config.maxSize > 0
        ? Infinity
        : 0;
    evictExcessEntries(useFetch._cache, globalCacheConfig.maxSize);
  }
}

export function clearFetchCache() {
  clearCacheStorage(useFetch._cache);
  useFetch._cache = new Map();
}
