import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry, sleep } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;
let consoleSpy = vi.spyOn(console, "log") as any;
window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with debounce", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
    consoleSpy = vi.spyOn(console, "log") as any;
    vi.useFakeTimers();
  });
  it("should retry work correctly", async () => {
    useFetch("https://example.com?status=400", { immediate: true, retry: 2 });
    await sleep(100);
    await retry(() => {
      expect(fetchSpy).toBeCalledTimes(3);
    });
  });
  it("should retry promise$ work correctly", async () => {
    const { promise$ } = useFetch("https://example.com?status=400", {
      immediate: true,
      retry: 3,
    });
    promise$.catch((data) => {
      console.log(data);
    });
    await sleep(100);
    await retry(() => {
      expect(consoleSpy).toBeCalledTimes(1);
    });
  });
});
