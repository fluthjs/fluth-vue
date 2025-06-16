import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import FluthTest from "./FluthUnsubscribe.vue";
import { $ } from "../index";

const consoleSpy = vi.spyOn(console, "log");

describe.sequential("useFluth", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    vi.useFakeTimers();
    consoleSpy.mockClear();
  });
  it("stream will unsubscribe after component unmount", async () => {
    const promise$ = $();
    const wrapper = mount(FluthTest, {
      props: { stream: promise$ },
    });
    promise$.next(1);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 1);
    consoleSpy.mockClear();
    wrapper.unmount();
    promise$.next(2);
    expect(consoleSpy).toHaveBeenCalledTimes(0);
  });
});
