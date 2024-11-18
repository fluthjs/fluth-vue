import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch, clearFetchCache } from "../index";
import "./mockServer";
import { isBelowNode18 } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;
window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with cache", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy.mockClear();
    fetchSpy = vi.spyOn(window, "fetch") as any;
  });
  it("should cache correctly", async () => {
    vi.useFakeTimers();
    const { execute, cancelRefresh, clearCache } = useFetch("https://example.com", {
      immediate: false,
      refresh: 100,
      cacheSetting: { cacheResolve: ({ url }) => url },
    });
    await execute();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchSpy).toBeCalledTimes(1);
    clearCache();
    cancelRefresh();
  });

  it("should cacheExpiration correctly", async () => {
    vi.useFakeTimers();
    const { execute, cancelRefresh, clearCache } = useFetch("https://example.com/test", {
      immediate: false,
      refresh: 100,
      cacheSetting: { expiration: 600, cacheResolve: ({ url }) => url },
    });
    await execute();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchSpy).toBeCalledTimes(2);
    clearCache();
    cancelRefresh();
  });

  it("should clearCache correctly", async () => {
    vi.useFakeTimers();
    const { execute, clearCache } = useFetch("https://example.com", {
      immediate: false,
      cacheSetting: { cacheResolve: ({ url }) => url },
    });
    await execute();
    expect(fetchSpy).toBeCalledTimes(1);
    clearCache();
    await execute();
    expect(fetchSpy).toBeCalledTimes(2);
    clearCache();
  });

  it("should clearAllCache correctly", async () => {
    vi.useFakeTimers();
    const { execute: execute1 } = useFetch("https://example.com?text=one", {
      immediate: false,
      cacheSetting: { cacheResolve: ({ url }) => url },
    });
    const { execute: execute2 } = useFetch("https://example.com?text=two", {
      immediate: false,
      cacheSetting: { cacheResolve: ({ url }) => url },
    });
    await execute1();
    await execute2();
    expect(fetchSpy).toBeCalledTimes(2);
    await execute1();
    await execute2();
    expect(fetchSpy).toBeCalledTimes(2);
    clearFetchCache();
    await execute1();
    await execute2();
    expect(fetchSpy).toBeCalledTimes(4);
    clearFetchCache();
  });

  it("should cacheResolver correctly", async () => {
    vi.useFakeTimers();
    const cacheResolve = ({ url, payload, type }: any) => url + type + payload.a;
    const { execute, clearCache } = useFetch("https://example.com", {
      immediate: false,
      cacheSetting: { cacheResolve },
    }).post({
      a: 1,
      b: 2,
    });
    const { execute: execute2 } = useFetch("https://example.com", {
      immediate: false,
      cacheSetting: { cacheResolve },
    }).post({ a: 1, c: 2 });
    await execute();
    await execute2();
    expect(fetchSpy).toBeCalledTimes(1);
    clearCache();
  });
});
