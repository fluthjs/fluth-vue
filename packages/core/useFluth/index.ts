import { Stream, Observable } from "fluth";
import {
  computed,
  shallowRef,
  isRef,
  isReactive,
  toRaw,
  Ref,
  ComputedRef,
  PropType,
  onScopeDispose,
  getCurrentScope,
  effectScope,
  EffectScope,
  defineComponent,
  VNodeChild,
  DefineComponent,
  h,
  watch,
} from "vue";

export * from "fluth";

const skipKey = "__v_skip";
const isRefKey = "__v_isRef";
const isShallowRefKey = "__v_isShallow";
const isReadonlyKey = "__v_isReadonly";

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

function deepClone<T>(value: T, seen = new WeakMap<object, any>()): T {
  const raw = toRaw(value);
  if (isRef(raw)) {
    return deepClone(raw.value, seen) as unknown as T;
  }
  if (raw === null || typeof raw !== "object") {
    return raw;
  }
  if (seen.has(raw)) {
    return seen.get(raw);
  }
  if (raw instanceof Date) {
    return new Date(raw.getTime()) as unknown as T;
  }
  if (raw instanceof RegExp) {
    return new RegExp(raw.source, raw.flags) as unknown as T;
  }
  if (ArrayBuffer.isView(raw)) {
    const NodeBuffer = (globalThis as any).Buffer;
    if (
      NodeBuffer &&
      typeof NodeBuffer.isBuffer === "function" &&
      NodeBuffer.isBuffer(raw)
    ) {
      return NodeBuffer.from(raw) as unknown as T;
    }
    const copiedBuffer = raw.buffer.slice(
      raw.byteOffset,
      raw.byteOffset + raw.byteLength,
    );
    if (raw instanceof DataView) {
      return new DataView(copiedBuffer) as unknown as T;
    }
    const TypedArrayCtor = raw.constructor as new (
      buffer: ArrayBufferLike,
    ) => ArrayBufferView;
    return new TypedArrayCtor(copiedBuffer) as unknown as T;
  }
  if (Array.isArray(raw)) {
    const arr: any[] = [];
    seen.set(raw, arr);
    for (let i = 0; i < raw.length; i++) {
      arr[i] = deepClone(raw[i], seen);
    }
    return arr as unknown as T;
  }
  if (raw instanceof Map) {
    const map = new Map();
    seen.set(raw, map);
    raw.forEach((v, k) => {
      map.set(k, deepClone(v, seen));
    });
    return map as unknown as T;
  }
  if (raw instanceof Set) {
    const set = new Set();
    seen.set(raw, set);
    raw.forEach((v) => {
      set.add(deepClone(v, seen));
    });
    return set as unknown as T;
  }
  const proto = Object.getPrototypeOf(raw);
  if (proto === Object.prototype || proto === null) {
    const cloned: Record<PropertyKey, any> =
      proto === null ? Object.create(null) : {};
    seen.set(raw, cloned);
    for (const key of Reflect.ownKeys(raw)) {
      const desc = Object.getOwnPropertyDescriptor(raw, key);
      if (desc && desc.enumerable) {
        cloned[key] = deepClone((raw as any)[key], seen);
      }
    }
    return cloned as T;
  }
  // Preserve DOM nodes and custom class instances by reference
  return raw;
}

/**
 * convert stream or observable to computed ref
 * @param this stream or observable
 * @returns computed ref
 */
function toCompt<T>(this: Stream<T> | Observable<T>): ComputedRef<T> {
  if (!(this instanceof Stream) && !(this instanceof Observable)) {
    throw new Error("toCompt only accepts Stream or Observable as input");
  }

  const value = shallowRef<T>(this.value as T);
  this.then((v: T) => {
    value.value = v;
  });
  return computed(() => value.value);
}

function isVueComponent(value: unknown): boolean {
  if (typeof value === "function") {
    return true;
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, any>;
    if (obj.__v_isVNode) {
      return false;
    }
    const target =
      obj.__vccOpts && typeof obj.__vccOpts === "object" ? obj.__vccOpts : obj;
    return (
      typeof target.setup === "function" ||
      typeof target.render === "function" ||
      typeof target.ssrRender === "function" ||
      typeof target.template === "string"
    );
  }
  return false;
}

const FluthRender = defineComponent({
  name: "FluthRender",
  props: {
    stream: {
      type: Object as PropType<Stream<any> | Observable<any>>,
      required: true,
    },
    renderFn: {
      type: Function as PropType<(value: any) => VNodeChild | DefineComponent>,
      default: undefined,
    },
  },
  setup(props) {
    const value = computed(() => props.stream.value);
    // vue-devtools friendly
    return { value };
  },
  render() {
    const currentValue = this.value;
    if (typeof this.renderFn === "function") {
      const result = this.renderFn(currentValue);
      if (result === null || result === undefined) {
        return "";
      }
      if (isVueComponent(result)) {
        const comp =
          typeof result === "object" &&
          result !== null &&
          "__vccOpts" in result &&
          (result as any).__vccOpts
            ? (result as any).__vccOpts
            : result;
        return h(comp as any);
      }
      return result;
    }
    if (currentValue === null || currentValue === undefined) {
      return "";
    }
    return String(currentValue);
  },
});

/**
 * create a component that render the stream value with render function or define component
 * @param this stream or observable
 * @param renderFn render function, if not provided, the stream value will be rendered as text
 * @returns VNode
 */
function render$<T>(
  this: Stream<T> | Observable<T>,
  renderFn?: (value: T) => VNodeChild | DefineComponent,
): VNodeChild {
  return h(FluthRender, {
    stream: this,
    renderFn: typeof renderFn === "function" ? renderFn : undefined,
  });
}

/**
 * enhance fluth stream and observable to have ref property
 * @param arg$ fluth stream
 */
function enhanceFluthStream(arg$: Stream | Observable) {
  if ((arg$ as any)[isRefKey]) return;

  (arg$ as any)[isRefKey] = true;
  (arg$ as any)[isShallowRefKey] = true;
  (arg$ as any)[isReadonlyKey] = true;
  (arg$ as any).toCompt = toCompt;
  (arg$ as any).render$ = render$;

  const value = shallowRef<any>(arg$.value);
  arg$.afterSetValue((v) => {
    value.value = v;
  });

  Object.defineProperty(arg$, "value", {
    get: () => value.value,
    set: () => {
      console.warn(
        "[fluth-vue] Stream/Observable .value is readonly. Use .next() or .set() to update the stream.",
      );
    },
    enumerable: true,
    configurable: true,
  });
}

/**
 * vue plugin for fluth
 */
export const vuePlugin = {
  thenAll: (_unsubscribe: () => void, observable: Observable) => {
    if (getCurrentScope()) {
      onScopeDispose(() => {
        observable.unsubscribe();
      });
    }
    if (!(observable as any)[skipKey]) (observable as any)[skipKey] = true;
    enhanceFluthStream(observable);
  },
};

export interface ToStreamOptions<T = any> {
  /**
   * Whether to deep clone the value before emitting to the stream, or a custom clone function.
   * Defaults to `true` (deep clones plain objects, arrays, Date, RegExp, TypedArrays, Map, Set;
   * unwraps nested refs; preserves functions, DOM nodes, and custom class instances by reference).
   * Note: when `clone: false`, mutating the same object reference in place will not trigger
   * Vue `shallowRef` updates.
   */
  clone?: boolean | ((value: T) => T);
  /**
   * Whether to watch deeply.
   * Defaults to `!isShallow(arg)` for refs and `true` for reactive objects.
   * Note: passing `deep: false` for a `reactive()` source requires Vue >= 3.5.
   */
  deep?: boolean;
}

/**
 * convert vue ref or computed ref or reactive to stream
 * @param arg vue ref or computed ref or reactive
 * @param options conversion options
 * @returns stream
 */
export function to$<T>(
  arg: Ref<T> | ComputedRef<T>,
  options?: ToStreamOptions<T>,
): Stream<T>;
export function to$<T extends object>(
  arg: T,
  options?: ToStreamOptions<T>,
): Stream<T>;
export function to$<T>(
  arg: Ref<T> | ComputedRef<T> | T,
  options: ToStreamOptions<T> = {},
): Stream<T> {
  const { clone = true, deep } = options;

  const resolveValue = (source: any): T => {
    const rawValue = isRef(source) ? source.value : source;
    if (typeof clone === "function") {
      return clone(rawValue);
    }
    if (clone === false) {
      return isReactive(rawValue) ? toRaw(rawValue) : rawValue;
    }
    return deepClone(rawValue);
  };

  const stream$ = $<T>(resolveValue(arg));

  let unWatch: (() => void) | undefined;
  if (isRef(arg)) {
    const isShallowSource = Boolean((arg as any)[isShallowRefKey]);
    unWatch = watch(
      arg,
      () => {
        stream$.next(resolveValue(arg));
      },
      { deep: deep ?? !isShallowSource, immediate: false },
    );
  } else if (isReactive(arg)) {
    unWatch = watch(
      arg as object,
      () => {
        stream$.next(resolveValue(arg));
      },
      { deep: deep ?? true, immediate: false },
    );
  } else {
    unWatch = watch(
      () => arg,
      () => {
        stream$.next(resolveValue(arg));
      },
      { deep: deep ?? true, immediate: false },
    );
  }

  const stopWatch = () => {
    unWatch?.();
    unWatch = undefined;
  };

  stream$.afterUnsubscribe(stopWatch);

  return stream$;
}

/**
 * create a render effect scope wrapper that will clean up previous and last effect when render function is called
 * @param render render function
 * @returns render function
 */
export function effect$(
  render: (...args: any[]) => VNodeChild,
): (...args: any[]) => VNodeChild {
  let currentScope: EffectScope | null = null;

  if (getCurrentScope()) {
    onScopeDispose(() => {
      currentScope?.stop();
      currentScope = null;
    });
  }

  return function (this: any, ...args: any[]) {
    currentScope?.stop();
    currentScope = null;

    const scope = effectScope(true);
    currentScope = scope;

    let result: VNodeChild | null = null;
    try {
      scope.run(() => {
        result = render.apply(this, args);
      });
    } catch (error) {
      scope.stop();
      currentScope = null;
      throw error;
    }

    return result;
  };
}

/**
 * batch convert object properties to streams
 * for recover stream or observable type which deconstructed in vue reactive
 * observable properties will also be converted to Stream
 * but once used some stream methods, it will be throw error
 * from a practical point of view, we can just convert all properties to Stream
 *
 * example:
 * const obj = reactive({
 *   a$: $("a"),
 *   b$: $("b"),
 * })
 * const { a$, b$ } = recover$(obj)
 * a$.next("c") // obj.a$ will be updated to "c"
 * b$.next("d") // obj.b$ will be updated to "d"
 *
 * @param reactiveObj reactive object
 * @returns object with converted streams
 */
export function recover$<T extends Record<string, any>>(
  reactiveObj: T,
): {
  [K in keyof T]: Stream<T[K]>;
} {
  return toRaw(reactiveObj) as any;
}

/**
 * create stream factory with default plugin
 */
export function $<T = any>(): Stream<T | undefined>;
export function $<T = any>(data: T | PromiseLike<T>): Stream<T>;

export function $<T = any>(data?: T | PromiseLike<T>) {
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
}
