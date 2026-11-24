import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { effectScope } from "vue";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, sleep } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18)("useFetch with refresh", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
  });
  it("should be refresh correctly", async () => {
    vi.useFakeTimers();
    const { execute, cancelRefresh } = useFetch("https://example.com", { immediate: false, refresh: 100 });
    await execute();
    await sleep(1000);
    expect(fetchSpy).toBeCalledTimes(11);
    cancelRefresh();
  });

  it("should be cancelRefresh correctly", async () => {
    vi.useFakeTimers();
    const { execute, cancelRefresh } = useFetch("https://example.com", { immediate: false, refresh: 100 });
    await execute();
    await sleep(500);
    cancelRefresh();
    await sleep(500);
    expect(fetchSpy).toBeCalledTimes(6);
  });

  it("should clear refresh interval when effect scope is disposed", async () => {
    vi.useFakeTimers();
    const scope = effectScope();
    scope.run(() => useFetch("https://example.com", { immediate: false, refresh: 100 }));
    await sleep(350);
    const calledTimes = fetchSpy.mock.calls.length;
    expect(calledTimes).toBeGreaterThan(0);

    scope.stop();
    expect(vi.getTimerCount()).toBe(0);
    await sleep(1000);
    expect(fetchSpy).toBeCalledTimes(calledTimes);
  });

  it("should keep refreshing without effect scope until cancelRefresh", async () => {
    vi.useFakeTimers();
    const { cancelRefresh } = useFetch("https://example.com", { immediate: false, refresh: 100 });
    await sleep(250);
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    cancelRefresh();
    expect(vi.getTimerCount()).toBe(0);
  });
});
