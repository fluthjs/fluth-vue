import type { MaybeRefOrGetter } from "@vueuse/shared";
import { toValue } from "@vueuse/shared";
import { isRef } from "vue";
import { Observable, Stream } from "../useFluth";
import type { Combination } from "./type";

export function joinPaths(start: string, end: string): string {
  if (!start) return end;
  if (!end) return start;
  const normalizedStart = start.replace(/\/+$/, "");
  const normalizedEnd = end.replace(/^\/+/, "");
  return `${normalizedStart}/${normalizedEnd}`;
}

export function addQueryParams(url: string, params: unknown): string {
  if (Object.prototype.toString.call(params) !== "[object Object]") return url;

  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const urlWithoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

  const queryIndex = urlWithoutHash.indexOf("?");
  const path =
    queryIndex >= 0 ? urlWithoutHash.slice(0, queryIndex) : urlWithoutHash;
  const query = queryIndex >= 0 ? urlWithoutHash.slice(queryIndex + 1) : "";

  const paramsObj = new URLSearchParams(query);
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      paramsObj.set(key, String(value));
    }
  });

  const serialized = paramsObj.toString();
  return serialized ? `${path}?${serialized}${hash}` : `${path}${hash}`;
}

// A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
export function isAbsoluteURL(url: string) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

export function getValue<T = any>(
  data: MaybeRefOrGetter<T> | Observable<T> | Stream<T> | undefined,
): T | undefined {
  if (data instanceof Observable || data instanceof Stream) return data.value;
  if (typeof data === "function") return (data as () => T)();
  if (isRef(data)) return toValue(data);
  return data;
}

export function headersToObject(
  headers: HeadersInit | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  if (
    (typeof Headers !== "undefined" && headers instanceof Headers) ||
    typeof (headers as Headers).entries === "function"
  ) {
    return Object.fromEntries((headers as Headers).entries());
  }
  return { ...(headers as Record<string, string>) };
}

export function combineCallbacks<T = any>(
  combination: Combination,
  ...callbacks: (
    | ((ctx: T) => void | Partial<T> | Promise<void | Partial<T>>)
    | undefined
  )[]
): ((ctx: T) => Promise<Partial<T>>) | undefined {
  const validCallbacks = callbacks.filter(
    (cb): cb is (ctx: T) => void | Partial<T> | Promise<void | Partial<T>> =>
      typeof cb === "function",
  );

  if (validCallbacks.length === 0) return undefined;

  if (combination === "overwrite") {
    const lastCallback = validCallbacks[validCallbacks.length - 1];
    return async (ctx: T) => {
      const result = await lastCallback(ctx);
      return result ? { ...ctx, ...result } : ctx;
    };
  }

  return async (ctx: T) => {
    let current = ctx;
    for (const callback of validCallbacks) {
      const result = await callback(current);
      if (result) {
        current = { ...current, ...result };
      }
    }
    return current;
  };
}
