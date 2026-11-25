import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { $ } from "../../useFluth";
import {
  addQueryParams,
  combineCallbacks,
  getValue,
  headersToObject,
  isAbsoluteURL,
  joinPaths,
} from "../utils";

describe("useFetch utils", () => {
  describe("joinPaths", () => {
    it("joins paths without duplicating slashes", () => {
      expect(joinPaths("https://example.com", "test")).toBe(
        "https://example.com/test",
      );
      expect(joinPaths("https://example.com/", "test")).toBe(
        "https://example.com/test",
      );
      expect(joinPaths("https://example.com", "/test")).toBe(
        "https://example.com/test",
      );
      expect(joinPaths("https://example.com/", "/test")).toBe(
        "https://example.com/test",
      );
      expect(joinPaths("https://example.com///", "///test/")).toBe(
        "https://example.com/test/",
      );
    });

    it("handles empty start or end segments", () => {
      expect(joinPaths("", "/test")).toBe("/test");
      expect(joinPaths("https://example.com", "")).toBe("https://example.com");
    });
  });

  describe("addQueryParams", () => {
    it("merges query params while preserving hash fragments", () => {
      expect(addQueryParams("https://example.com/path#sec", { a: 1 })).toBe(
        "https://example.com/path?a=1#sec",
      );
      expect(
        addQueryParams("https://example.com/path?x=1#sec", { y: 2, x: 3 }),
      ).toBe("https://example.com/path?x=3&y=2#sec");
    });

    it("omits null and undefined values and avoids trailing question mark", () => {
      expect(
        addQueryParams("https://example.com/path", {
          a: undefined,
          b: null,
        }),
      ).toBe("https://example.com/path");
      expect(addQueryParams("https://example.com/path#top", {})).toBe(
        "https://example.com/path#top",
      );
      expect(
        addQueryParams("https://example.com/path", {
          zero: 0,
          flag: false,
          empty: "",
          skip: undefined,
        }),
      ).toBe("https://example.com/path?zero=0&flag=false&empty=");
    });

    it("returns original url for non-plain-object params", () => {
      expect(addQueryParams("https://example.com", null)).toBe(
        "https://example.com",
      );
      expect(addQueryParams("https://example.com", "raw")).toBe(
        "https://example.com",
      );
    });
  });

  describe("getValue", () => {
    it("unwraps Stream, Observable, getter functions, refs, and plain values", () => {
      const stream$ = $("stream-val");
      const obs$ = stream$.then((v) => `${v}-obs`);
      const r = ref("ref-val");
      const c = computed(() => `${r.value}-computed`);

      expect(getValue(stream$)).toBe("stream-val");
      expect(getValue(obs$)).toBeUndefined();
      expect(getValue(() => "getter-val")).toBe("getter-val");
      expect(getValue(r)).toBe("ref-val");
      expect(getValue(c)).toBe("ref-val-computed");
      expect(getValue("plain")).toBe("plain");
    });
  });

  describe("headersToObject", () => {
    it("normalizes Headers, tuple arrays, plain objects, and undefined", () => {
      const headers = new Headers();
      headers.append("X-Test", "1");
      expect(headersToObject(headers)).toEqual({ "x-test": "1" });
      expect(
        headersToObject([
          ["Authorization", "Bearer token"],
          ["X-Role", "admin"],
        ]),
      ).toEqual({ Authorization: "Bearer token", "X-Role": "admin" });

      const raw = { Accept: "application/json" };
      const copied = headersToObject(raw);
      expect(copied).toEqual(raw);
      expect(copied).not.toBe(raw);
      expect(headersToObject(undefined)).toEqual({});
    });
  });

  describe("combineCallbacks", () => {
    it("returns undefined when all callbacks are undefined", () => {
      expect(combineCallbacks("chain", undefined, undefined)).toBeUndefined();
      expect(
        combineCallbacks("overwrite", undefined, undefined),
      ).toBeUndefined();
    });

    it("uses last non-undefined callback in overwrite mode", async () => {
      const globalCb = (ctx: { value: string }) => ({
        value: `${ctx.value}:global`,
      });
      const localCb = (ctx: { value: string }) => ({
        value: `${ctx.value}:local`,
      });

      const onlyGlobal = combineCallbacks("overwrite", globalCb, undefined);
      expect(onlyGlobal).toBeDefined();
      expect(await onlyGlobal?.({ value: "init" })).toEqual({
        value: "init:global",
      });

      const withLocal = combineCallbacks("overwrite", globalCb, localCb);
      expect(await withLocal?.({ value: "init" })).toEqual({
        value: "init:local",
      });
    });

    it("chains callbacks and preserves context when a callback returns void", async () => {
      const combined = combineCallbacks<{ value: string }>(
        "chain",
        (ctx) => {
          ctx.value += ":mutated";
        },
        (ctx) => ({ value: `${ctx.value}:returned` }),
      );
      expect(await combined?.({ value: "start" })).toEqual({
        value: "start:mutated:returned",
      });
    });
  });

  describe("isAbsoluteURL", () => {
    it("detects scheme and protocol-relative URLs", () => {
      expect(isAbsoluteURL("https://example.com")).toBe(true);
      expect(isAbsoluteURL("//cdn.example.com/a.js")).toBe(true);
      expect(isAbsoluteURL("/relative/path")).toBe(false);
    });
  });
});
