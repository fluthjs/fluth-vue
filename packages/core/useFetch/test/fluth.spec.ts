import { nextTick } from "vue-demi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry } from "./utils";

const consoleSpy = vi.spyOn(console, "log") as any;

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with fluth", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    consoleSpy.mockClear;
  });
  it("should resolve stream correctly", async () => {
    const { execute, promise$ } = useFetch("https://example.com?text=hello", { immediate: false });
    promise$.then((data: string) => {
      console.log(data);
    });
    await execute();
    await nextTick();
    await retry(() => {
      expect(consoleSpy).toHaveBeenCalledWith("hello");
    });
  });

  it("should reject stream correctly", async () => {
    const { execute, promise$ } = useFetch("https://example.com?status=400", { immediate: false });
    promise$.catch((data: string) => {
      console.log(data);
    });
    try {
      await execute();
    } catch (e) {
      console.info(e);
    }
    await nextTick();
    await retry(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Bad Request");
    });
  });
});
