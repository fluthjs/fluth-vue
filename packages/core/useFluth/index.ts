import { Stream, Observable } from "fluth";
import {
  onScopeDispose,
  getCurrentScope,
  ref,
  computed,
  ComputedRef,
} from "vue-demi";

export * from "fluth";

const skipKey = "__v_skip";
/**
 * vue plugin for fluth
 */
export const vuePlugin = {
  thenAll: (unsubscribe: () => void, observable: Observable) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
    if (!(observable as any)[skipKey]) (observable as any)[skipKey] = true;
  },
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
export function $<T = any>(): Stream<T, false>;
export function $<T = any>(data: T): Stream<T, true>;
export function $<T = any>(data?: T) {
  const stream$ = new Stream<T, boolean>(data);
  (stream$ as any)[skipKey] = true;
  return stream$.use(vuePlugin);
}
