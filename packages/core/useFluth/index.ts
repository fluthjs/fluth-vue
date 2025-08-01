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
  VNodeChild,
  defineComponent,
  h,
  DefineComponent,
  effectScope,
  RenderFunction,
  EffectScope,
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
export function toComp<T>(arg$: Stream<T>): ComputedRef<T>;
export function toComp<T>(arg: Observable<T>): ComputedRef<T | undefined>;
export function toComp<T>(arg$: Stream<T> | Observable<T>) {
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
  [K in keyof T]: T[K] extends Stream<infer U> | Observable<infer U>
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
export function to$<T>(arg: Ref<T> | ComputedRef<T> | Reactive<T>): Stream<T> {
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
 * create a component that render the stream value with render function or define component
 * @param arg$ stream
 * @param render render function, if not provided, the stream value will be rendered as a span element
 * @returns component
 */
export function render$<T>(
  arg$: Stream<T> | Observable<T>,
  render?: (value: T) => VNodeChild | DefineComponent,
): DefineComponent {
  return defineComponent({
    name: "Render$",
    setup() {
      const value = toComp(arg$);
      // vue-devtool friendly
      return { value };
    },
    render() {
      if (typeof render === "function") {
        try {
          // Safer type handling - handle undefined case
          const safeValue =
            this.value !== undefined ? this.value : (undefined as unknown as T);
          const result = render(safeValue);

          // Handle null/undefined results
          if (result === null || result === undefined) {
            return ""; // Return empty string for null/undefined
          }

          // Check if it's a Vue component with improved detection (inline)
          const isComponent = (() => {
            if (typeof result === "function") {
              return true; // Function component
            }

            if (typeof result === "object" && result !== null) {
              // More strict component detection to avoid false positives
              const hasSetup =
                "setup" in result && typeof result.setup === "function";
              const hasRender =
                "render" in result && typeof result.render === "function";
              const hasTemplate =
                "template" in result && typeof result.template === "string";

              // Only consider it a component if it has functional properties, not just a name
              return hasSetup || hasRender || hasTemplate;
            }

            return false;
          })();

          if (isComponent) {
            return h(result as any);
          }

          // Otherwise return VNode directly
          return result;
        } catch (error) {
          // Error handling: render fallback content
          console.error("render$ render function error:", error);
          return "";
        }
      } else {
        // Use textContent instead of innerHTML for better security (inline safeToString)
        const safeText = (() => {
          if (this.value === null || this.value === undefined) {
            return "";
          }
          return String(this.value);
        })();
        return safeText;
      }
    },
  });
}

/**
 * create a render effect scope wrapper that will clean up previous and last effect when render function is called
 * @param render render function
 * @returns render function
 */
export function effect$(render: RenderFunction): () => VNodeChild {
  let currentScope: EffectScope | null = null;

  //  remove last render effect when component unmount
  if (getCurrentScope()) {
    onScopeDispose(() => {
      currentScope?.stop();
    });
  }

  return function () {
    // remove previous render effect when render function is called again
    currentScope?.stop();

    // create a new effect scope
    const scope = effectScope();
    currentScope = scope;

    let result: VNodeChild | null = null;
    // Execute the render function within the new scope
    scope.run(() => {
      result = render();
    });

    return result;
  };
}

/**
 * create stream factory with default plugin
 */
export function $<T = any>(): Stream<T | undefined>;
export function $<T = any>(data: T): Stream<T>;
export function $<T = any>(data?: T) {
  const stream$ = new Stream<T>(data);
  (stream$ as any)[skipKey] = true;
  return stream$.use(vuePlugin);
}

/**
 * set global factory
 */
if (typeof globalThis !== "undefined") {
  // @ts-expect-error globalThis is not defined in browser
  globalThis.__fluth_global_factory__ = $;
} else if (typeof window !== "undefined") {
  // @ts-expect-error window is not defined in node
  window.__fluth_global_factory__ = $;
}
// @ts-expect-error global is not defined in browser
else if (typeof global !== "undefined") {
  // @ts-expect-error global is not defined in browser
  global.__fluth_global_factory__ = $;
} else if (typeof self !== "undefined") {
  // @ts-expect-error self is not defined in browser
  self.__fluth_global_factory__ = $;
}
