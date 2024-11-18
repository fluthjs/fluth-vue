import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry, sleep } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;

describe.skipIf(isBelowNode18).sequential("useFetch with debounce", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
  });

  it("should throttle work correctly", async () => {
    vi.useFakeTimers();
    const { cancelRefresh } = useFetch("https://example.com", { immediate: false, refresh: 30, throttle: 100 });
    await sleep(250);
    cancelRefresh();
    await retry(() => {
      expect(fetchSpy).toBeCalledTimes(3);
    });
  });

  it("should throttle work correctly with wait and options", async () => {
    vi.useFakeTimers();
    const { cancelRefresh } = useFetch("https://example.com", {
      immediate: false,
      refresh: 30,
      throttle: { wait: 100, options: { leading: false, trailing: true } },
    });
    await sleep(250);
    cancelRefresh();
    await retry(() => {
      expect(fetchSpy).toBeCalledTimes(2);
    });
  });
});
