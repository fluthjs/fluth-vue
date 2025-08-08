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
  shallowRef,
} from "vue";

export * from "fluth";

const skipKey = "__v_skip";
const isRefKey = "__v_isRef";
const isShallowRefKey = "__v_isShallow";

// enhance fluth stream and observable to have ref property
declare module "fluth" {
  interface Stream<T> extends Readonly<Ref<T>> {
    toCompt: () => ComputedRef<T>;
    render$: (
      renderFn?: (value: T) => VNodeChild | DefineComponent,
    ) => VNodeChild;
  }
  interface Observable<T> extends Readonly<Ref<T | undefined>> {
    toCompt: () => ComputedRef<T | undefined>;
    render$: (
      renderFn?: (value: T | undefined) => VNodeChild | DefineComponent,
    ) => VNodeChild;
  }
}

/**
 * convert stream or observable to computed ref
 * @param this stream or observable
 * @returns computed ref
 */
function toCompt<T>(this: Stream<T> | Observable<T>): ComputedRef<T> {
  // check input type
  if (!(this instanceof Stream) && !(this instanceof Observable)) {
    throw new Error("toComp only accepts Stream or Observable as input");
  }

  const value = ref(this.value);
  this.then((v: T) => {
    value.value = v;
  });
  return computed(() => value.value);
}

/**
 * create a component that render the stream value with render function or define component
 * @param this stream or observable
 * @param renderFn render function, if not provided, the stream value will be rendered as a span element
 * @returns component
 */
function render$<T>(
  this: Stream<T> | Observable<T>,
  renderFn?: (value: T) => VNodeChild | DefineComponent,
): VNodeChild {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const arg$ = this;
  const component = defineComponent({
    name: "FluthRender",
    setup() {
      const value = arg$.toCompt();
      // vue-devtool friendly
      return { value };
    },
    render() {
      if (typeof renderFn === "function") {
        try {
          // Safer type handling - handle undefined case
          const safeValue =
            this.value !== undefined ? this.value : (undefined as unknown as T);
          const result = renderFn(safeValue as T);

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
          console.error("fluth render function run error:", error);
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

  return h(component);
}

/**
 * enhance fluth stream and observable to have ref property
 * @param arg$ fluth stream
 */
function enhanceFluthStream(arg$: Stream | Observable) {
  if ((arg$ as any)[isRefKey]) return;

  // set observable to ref
  (arg$ as any)[isRefKey] = true;
  (arg$ as any)[isShallowRefKey] = true;
  // add toCompt and render method to stream
  (arg$ as any).toCompt = toCompt;
  (arg$ as any).render$ = render$;

  const value = shallowRef<any>(arg$.value);
  // update ref value when observable value changes
  arg$.afterSetValue((v) => {
    value.value = v;
  });

  Object.defineProperty(arg$, "value", {
    get: () => value.value,
    enumerable: true,
    configurable: true,
  });
}

/**
 * vue plugin for fluth
 */
export const vuePlugin = {
  thenAll: (unsubscribe: () => void, observable: Observable) => {
    if (getCurrentScope()) onScopeDispose(unsubscribe);
    if (!(observable as any)[skipKey]) (observable as any)[skipKey] = true;
    enhanceFluthStream(observable);
  },
};

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
    const scope = effectScope?.();
    currentScope = scope;

    let result: VNodeChild | null = null;
    // Execute the render function within the new scope
    scope &&
      scope.run(() => {
        result = render();
      });

    return result;
  };
}

/**
 * batch convert object properties to streams
 * @param obj object with stream-like properties
 * @returns object with converted streams
 */
export function recover$<T extends Record<string, any>>(
  obj: T,
): {
  [K in keyof T]: T[K] extends {
    value: unknown;
    then: unknown;
    thenOnce: unknown;
    thenImmediate: unknown;
  }
    ? T[K] extends { next: unknown; set: unknown }
      ? Stream<T[K]["value"]>
      : Observable<T[K]["value"] | undefined>
    : T[K];
} {
  return obj as any;
}

/**
 * create stream factory with default plugin
 */
export function $<T = any>(): Stream<T | undefined>;
export function $<T = any>(data: T): Stream<T>;

export function $<T = any>(data?: T) {
  const stream$ = new Stream<T>(data);
  (stream$ as any)[skipKey] = true;
  enhanceFluthStream(stream$);
  return stream$.use(vuePlugin);
}

/**
 * set global factory
 */
if (typeof globalThis !== "undefined") {
  (globalThis as any).__fluth_global_factory__ = $;
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
