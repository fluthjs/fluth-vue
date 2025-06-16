import { createStream, Stream, Observable } from "fluth";
import {
  onScopeDispose,
  getCurrentScope,
  ref,
  computed,
  ComputedRef,
} from "vue-demi";

export * from "fluth";

/**
 * vue plugin for fluth
 */
export const vuePlugin = {
  then: (unsubscribe: () => void) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
  },
  chain: () => ({
    ["__v_skip"]: true,
  }),
};

/**
 * convert stream to computed ref
 * @param arg stream
 * @returns computed ref
 */
export function toComp<T>(arg: Stream<T, true>): ComputedRef<T>;
export function toComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
export function toComp<T, I extends boolean>(
  arg: Stream<T, I> | Observable<T>,
) {
  const value = ref(arg.value);
  arg.then((v: T) => {
    value.value = v;
  });
  return computed(() => value.value);
}

/**
 * create stream factory with default plugin
 */
export const $ = createStream(vuePlugin);
