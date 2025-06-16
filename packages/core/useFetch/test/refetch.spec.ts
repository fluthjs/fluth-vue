import { ref, reactive } from "vue-demi";
import { beforeEach, describe, expect, it, vi } from "vitest";
import nodeFetch from "node-fetch";
import { useFetch } from "../index";
import "./mockServer";
import { isBelowNode18, retry, sleep } from "./utils";
import { $ } from "../../useFluth/index";

let fetchSpy = vi.spyOn(window, "fetch") as any;

function fetchSpyUrl(idx = 0) {
  return fetchSpy.mock.calls[idx][0];
}

window.fetch = nodeFetch as any;

describe.skipIf(isBelowNode18)("useFetch with refetch", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    fetchSpy = vi.spyOn(window, "fetch") as any;
  });

  it("should refetch if refetch is set to true", async () => {
    const url = ref("https://example.com");
    useFetch(url, { refetch: true });
    url.value = "https://example.com?text";
    await retry(() => expect(fetchSpy).toBeCalledTimes(2));
  });

  it("should be url with right with url is stream", async () => {
    const url = $("https://example.com");
    useFetch(url, { refetch: true });
    url.next("https://example.com?text");
    await retry(() => expect(fetchSpy).toBeCalledTimes(2));
  });

  it("should auto refetch when the refetch is set to true and the payload is a ref", async () => {
    const param = ref({ num: 1 });
    useFetch("https://example.com", { refetch: true }).post(param);
    param.value.num = 2;
    await retry(() => expect(fetchSpy).toBeCalledTimes(2));
  });

  it("should be refetch correctly when payload is reactive", async () => {
    const param = reactive({ num: 1 });
    useFetch("https://example.com", { refetch: true }).post(param);
    param.num = 2;
    await retry(() => expect(fetchSpy).toBeCalledTimes(2));
  });

  it("should be refetch correctly when payload is stream", async () => {
    const param = $({ num: 1 });
    useFetch("https://example.com", { refetch: true }).post(param);
    param.set((state) => (state.num = 2));
    await retry(() => expect(fetchSpy).toBeCalledTimes(2));
  });

  it("should be url with right with absolute url", async () => {
    const url = ref("/url");
    const payload = ref({ a: 1 });
    try {
      useFetch(url, { refetch: true, immediate: true }).get(payload).text();
    } catch (e) {
      console.info(e);
    }
    await retry(() => expect(fetchSpyUrl()).toEqual(`/url?a=1`));
  });

  it("should be url with right with relative url", async () => {
    const url = ref("./url");
    const payload = ref({ a: 1 });
    try {
      useFetch(url, { refetch: true, immediate: true }).get(payload).text();
    } catch (e) {
      console.info(e);
    }
    await retry(() => expect(fetchSpyUrl()).toEqual(`./url?a=1`));
  });

  it("should be url with right with get object", async () => {
    vi.useFakeTimers();
    const url = ref("https://example.com/url?a=3");
    const payload = ref({ a: 1 });
    const { data } = await useFetch(url, { refetch: true, immediate: true })
      .get(payload)
      .text();
    await retry(() =>
      expect(data.value).toEqual(`https://example.com/url?a=1`),
    );
    payload.value = { a: 2 };
    await sleep(10);
    await retry(() =>
      expect(data.value).toEqual(`https://example.com/url?a=2`),
    );
  });
});
