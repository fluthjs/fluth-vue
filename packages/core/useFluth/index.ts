import { createStream } from "fluth";
import { onScopeDispose, getCurrentScope, ReactiveFlags } from "vue-demi";

export * from "fluth";
export type * from "fluth";

export const vuePlugin = {
  then: (unsubscribe: () => void) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
  chain: () => ({
    [ReactiveFlags?.SKIP || "__v_skip"]: true,
  }),
};

export const $ = createStream(vuePlugin);
