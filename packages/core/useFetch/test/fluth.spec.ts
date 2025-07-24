import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry } from "./utils";
import { $ } from "../../useFluth/index";

const consoleSpy = vi.spyOn(console, "log") as any;

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18).sequential("useFetch with fluth", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    consoleSpy.mockClear();
  });
  it("should resolve stream correctly", async () => {
    const { execute, promise$ } = useFetch("https://example.com?text=hello", {
      immediate: false,
    });
    promise$.then((data) => {
      console.log(data);
    });
    await execute();
    await retry(() => expect(consoleSpy).toHaveBeenCalledWith("hello"));
  });

  it("should reject stream correctly", async () => {
    const { execute, promise$ } = useFetch("https://example.com?status=400", {
      immediate: false,
    });
    promise$.catch((data: string) => {
      console.log(data);
    });
    try {
      await execute();
    } catch (e) {
      console.info(e);
    }
    await retry(() => expect(consoleSpy).toHaveBeenCalledWith("Bad Request"));
  });

  it("should use right url", async () => {
    let url = "";
    const url1 = "https://example.com";
    const url$ = $(url1);
    useFetch(url$, {
      beforeFetch: (ctx) => {
        url = ctx.url;
      },
    }).get();

    await retry(() => expect(url).toEqual(url1));
  });

  it("should use right get payload", async () => {
    let url = "";
    const url1 = "https://example.com";
    const url$ = $(url1);
    const payload = $({ a: 1, b: 2 });
    useFetch(url$, {
      beforeFetch: (ctx) => {
        url = ctx.url;
      },
    }).get(payload);

    await retry(() => expect(url).toEqual(url1 + "?a=1&b=2"));
  });

  it("should use right post payload", async () => {
    const payload = $({ a: 1, b: 2 });
    let options: any;
    useFetch("https://example.com", {
      beforeFetch: (ctx) => {
        options = ctx.options;
      },
    }).post(payload, "unknown");

    await retry(() => {
      expect(options.body).toEqual(payload.value);
    });
  });
});
