import { Stream, Observable } from "fluth";
import { cloneDeep } from "lodash-es";
import {
  onScopeDispose,
  getCurrentScope,
  ref,
  computed,
  watch,
  Ref,
  ComputedRef,
  Reactive,
  isRef,
  isReactive,
  toRaw,
  DirectiveBinding,
  Directive,
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
 * convert stream or observable to computed ref
 * @param arg$ stream
 * @returns computed ref
 */
export function toComp<T>(arg$: Stream<T, true>): ComputedRef<T>;
export function toComp<T>(
  arg: Stream<T, false> | Observable<T>,
): ComputedRef<T | undefined>;
export function toComp<T, I extends boolean>(
  arg$: Stream<T, I> | Observable<T>,
) {
  // check input type
  if (!(arg$ instanceof Stream) && !(arg$ instanceof Observable)) {
    throw new Error("toComp only accepts Stream or Observable as input");
  }

  const value = ref(arg$.value);
  arg$.then((v: T) => {
    value.value = v;
  });
  return computed(() => value.value);
}

/**
 * convert an object with Stream/Observable properties to an object with ComputedRef properties
 * @param target the object to convert
 * @returns an object with ComputedRef properties
 */
export function toComps<T extends Record<string, any>>(
  target: T,
): {
  [K in keyof T]: T[K] extends Stream<infer U, any> | Observable<infer U>
    ? ComputedRef<U | undefined>
    : T[K];
} {
  if (Object.prototype.toString.call(target) === "[object Object]") {
    return Object.keys(target).reduce((acc, key) => {
      if (target[key] instanceof Stream || target[key] instanceof Observable)
        acc[key] = toComp(target[key]);
      else acc[key] = target[key];
      return acc;
    }, {} as any);
  } else {
    throw new Error("comComps param must be object");
  }
}

/**
 * convert vue ref or computed ref or reactive to stream
 * @param arg vue ref or computed ref or reactive
 * @returns stream
 */
export function to$<T>(
  arg: Ref<T> | ComputedRef<T> | Reactive<T>,
): Stream<T, true> {
  const getClonedValue = (arg: Ref<T> | ComputedRef<T> | Reactive<T>) => {
    if (isRef(arg)) {
      return cloneDeep(arg.value);
    }
    if (isReactive(arg)) {
      return cloneDeep(toRaw(arg));
    }
    return cloneDeep(arg as any);
  };
  const stream$ = $<T>(getClonedValue(arg));

  const unWatch = watch(
    () => arg,
    () => {
      stream$.next(getClonedValue(arg));
    },
    { deep: true, immediate: false },
  );

  stream$.afterUnsubscribe(() => {
    unWatch();
  });

  return stream$;
}

/**
 * vue directive, convert stream value to dom element content
 */
export const render$: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const stream$ = binding.value;
    if (!(stream$ instanceof Stream) && !(stream$ instanceof Observable)) {
      throw new Error("$render only accepts Stream or Observable as input");
    }

    const observable$ = stream$.thenImmediate((v) => {
      el.textContent = v?.toString() ?? "";
    });

    (el as any).__fluth_unsubscribe = () => observable$.unsubscribe();
  },
  beforeUnmount(el: HTMLElement) {
    (el as any).__fluth_unsubscribe?.();
    (el as any).__fluth_unsubscribe = null;
  },
};

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
