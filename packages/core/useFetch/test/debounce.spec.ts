import { nextTick } from "vue-demi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry, sleep } from "./utils";

let fetchSpy = vi.spyOn(window, "fetch") as any;

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with debounce", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
    vi.useFakeTimers();
  });
  it("should debounce work correctly", async () => {
    const { execute } = useFetch("https://example.com", { immediate: false, debounce: 100 });
    execute();
    await sleep(80);
    execute();
    await sleep(80);
    await execute();
    await nextTick();
    await retry(() => {
      expect(fetchSpy).toBeCalledTimes(1);
    });
  });
  it("should debounce work correctly with wait and options", async () => {
    const { execute } = useFetch("https://example.com", {
      immediate: false,
      debounce: { wait: 100, options: { leading: true, trailing: true } },
    });
    execute();
    await sleep(80);
    execute();
    await sleep(80);
    await execute();
    await nextTick();
    await retry(() => {
      expect(fetchSpy).toBeCalledTimes(2);
    });
  });
});
