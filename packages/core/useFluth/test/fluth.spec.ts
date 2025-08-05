import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, computed, watch, ref } from "vue";

import { $, Stream } from "../index";

const consoleSpy = vi.spyOn(console, "log");

describe.sequential("useFluth", () => {
  beforeEach(() => {
    process.on("unhandledRejection", () => null);
    vi.useFakeTimers();
    consoleSpy.mockClear();
  });
  describe("stream will unsubscribe after component unmount", () => {
    it("stream in setup function will unsubscribe after component unmount", async () => {
      const promise$ = $();

      // Create test component directly in the test
      const FluthTest = defineComponent({
        template: `<div>hello</div>`,
        props: {
          stream: {
            type: Object as () => Stream,
            required: false,
          },
        },
        setup(props) {
          props.stream?.then((value) => console.log(value));
          return {};
        },
      });

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

  describe("vue template reactive rendering", () => {
    it("stream should trigger Vue template dynamic rendering when next() is called", async () => {
      // 创建一个流，初始值为字符串
      const dataStream$ = $("Initial Value");

      // 创建测试组件，在template中直接使用流
      const TestComponent = defineComponent({
        template: `
          <div data-testid="container">
            <h1>Stream Dynamic Rendering Test</h1>
            <div data-testid="stream-content">
              <div data-testid="stream-value">Current: {{ dataStream$.ref.value }}</div>
            </div>
            <div data-testid="stream-type">Type: {{ typeof dataStream$.ref.value }}</div>
          </div>
        `,
        setup() {
          return { dataStream$ };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始渲染
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Initial Value",
      );

      // 测试第一次next更新
      dataStream$.next("Updated Value 1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Updated Value 1",
      );

      // 测试第二次next更新
      dataStream$.next("Updated Value 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Updated Value 2",
      );

      // 测试不同数据类型
      dataStream$.next(42 as any);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: 42",
      );

      // 测试字符串类型
      dataStream$.next("Final String");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Final String",
      );
    });
    it("stream ref property should trigger Vue template dynamic rendering when next() is called", async () => {
      // 创建一个流，初始值为字符串
      const dataStream$ = $("Initial Value");

      // 创建测试组件，在template中直接使用流
      const TestComponent = defineComponent({
        template: `
          <div data-testid="container">
            <h1>Stream Dynamic Rendering Test</h1>
            <div data-testid="stream-content">
              <div data-testid="stream-value">Current: {{ dataStream$Ref }}</div>
            </div>
            <div data-testid="stream-type">Type: {{ typeof dataStream$Ref }}</div>
          </div>
        `,
        setup() {
          const dataStream$Ref = dataStream$.ref;
          return { dataStream$Ref };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始渲染
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Initial Value",
      );

      // 测试第一次next更新
      dataStream$.next("Updated Value 1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Updated Value 1",
      );

      // 测试第二次next更新
      dataStream$.next("Updated Value 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Updated Value 2",
      );

      // 测试不同数据类型
      dataStream$.next(42 as any);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: 42",
      );

      // 测试字符串类型
      dataStream$.next("Final String");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Current: Final String",
      );
    });

    it("stream should trigger template rendering for complex objects", async () => {
      // 测试复杂对象的动态渲染
      const objectStream$ = $({ name: "John", age: 25 });

      const TestComponent = defineComponent({
        template: `
          <div data-testid="object-container">
            <div data-testid="object-value">
              <span data-testid="name">Name: {{ objectStream$.ref.value.name }}</span>
              <span data-testid="age">Age: {{ objectStream$.ref.value.age }}</span>
            </div>
            <div data-testid="object-json">{{ JSON.stringify(objectStream$.ref.value) }}</div>
          </div>
        `,
        setup() {
          return { objectStream$ };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始对象渲染
      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: John");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 25");

      // 更新对象
      objectStream$.next({ name: "Alice", age: 30 });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: Alice");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 30");

      // 部分更新对象
      objectStream$.next({ name: "Bob", age: 35 });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: Bob");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 35");
    });

    it("stream ref property should trigger template rendering for complex objects", async () => {
      // 测试复杂对象的动态渲染
      const objectStream$ = $({ name: "John", age: 25 });

      const TestComponent = defineComponent({
        template: `
          <div data-testid="object-container">
            <div data-testid="object-value">
              <span data-testid="name">Name: {{ objectStream$Ref.name }}</span>
              <span data-testid="age">Age: {{ objectStream$Ref.age }}</span>
            </div>
            <div data-testid="object-json">{{ JSON.stringify(objectStream$Ref) }}</div>
          </div>
        `,
        setup() {
          const objectStream$Ref = objectStream$.ref;
          return { objectStream$Ref };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始对象渲染
      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: John");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 25");

      // 更新对象
      objectStream$.next({ name: "Alice", age: 30 });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: Alice");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 30");

      // 部分更新对象
      objectStream$.next({ name: "Bob", age: 35 });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="name"]').text()).toBe("Name: Bob");
      expect(wrapper.find('[data-testid="age"]').text()).toBe("Age: 35");
    });

    it("multiple streams should render independently in template", async () => {
      // 测试多个流独立渲染
      const stream1$ = $("Stream 1");
      const stream2$ = $("Stream 2");

      const TestComponent = defineComponent({
        template: `
          <div data-testid="multi-stream-container">
            <div data-testid="stream1-wrapper">
              <span data-testid="stream1-value">S1: {{ stream1$.ref.value }}</span>
            </div>
            <div data-testid="stream2-wrapper">
              <span data-testid="stream2-value">S2: {{ stream2$.ref.value }}</span>
            </div>
            <div data-testid="combined">Combined: {{ stream1$.ref.value }} & {{ stream2$.ref.value }}</div>
          </div>
        `,
        setup() {
          return { stream1$, stream2$ };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始状态
      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Stream 1 & Stream 2",
      );

      // 只更新第一个流
      stream1$.next("Updated Stream 1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Updated Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Stream 2",
      ); // 第二个流不变
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Updated Stream 1 & Stream 2",
      );

      // 只更新第二个流
      stream2$.next("Updated Stream 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Updated Stream 1",
      ); // 第一个流不变
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Updated Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Updated Stream 1 & Updated Stream 2",
      );

      // 同时更新两个流
      stream1$.next("Final Stream 1");
      stream2$.next("Final Stream 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Final Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Final Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Final Stream 1 & Final Stream 2",
      );
    });

    it("multiple streams ref property should render independently in template", async () => {
      // 测试多个流独立渲染
      const stream1$ = $("Stream 1");
      const stream2$ = $("Stream 2");

      const TestComponent = defineComponent({
        template: `
          <div data-testid="multi-stream-container">
            <div data-testid="stream1-wrapper">
              <span data-testid="stream1-value">S1: {{ stream1$Ref }}</span>
            </div>
            <div data-testid="stream2-wrapper">
              <span data-testid="stream2-value">S2: {{ stream2$Ref }}</span>
            </div>
            <div data-testid="combined">Combined: {{ stream1$Ref }} & {{ stream2$Ref }}</div>
          </div>
        `,
        setup() {
          const stream1$Ref = stream1$.ref;
          const stream2$Ref = stream2$.ref;
          return { stream1$Ref, stream2$Ref };
        },
      });

      const wrapper = mount(TestComponent);

      // 验证初始状态
      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Stream 1 & Stream 2",
      );

      // 只更新第一个流
      stream1$.next("Updated Stream 1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Updated Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Stream 2",
      ); // 第二个流不变
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Updated Stream 1 & Stream 2",
      );

      // 只更新第二个流
      stream2$.next("Updated Stream 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Updated Stream 1",
      ); // 第一个流不变
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Updated Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Updated Stream 1 & Updated Stream 2",
      );

      // 同时更新两个流
      stream1$.next("Final Stream 1");
      stream2$.next("Final Stream 2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream1-value"]').text()).toBe(
        "S1: Final Stream 1",
      );
      expect(wrapper.find('[data-testid="stream2-value"]').text()).toBe(
        "S2: Final Stream 2",
      );
      expect(wrapper.find('[data-testid="combined"]').text()).toBe(
        "Combined: Final Stream 1 & Final Stream 2",
      );
    });

    it("stream should trigger computed recalculation using stream.value directly", async () => {
      // Test stream's native reactivity with Vue computed
      const numberStream$ = $(10);
      let computedCallCount = 0;

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-computed-container">
            <div data-testid="original-value">Original: {{ numberStream$.ref.value }}</div>
            <div data-testid="computed-value">Computed: {{ computedValue }}</div>
            <div data-testid="call-count">Call Count: {{ callCount }}</div>
          </div>
        `,
        setup() {
          const computedValue = computed(() => {
            computedCallCount++;
            return numberStream$.ref.value * 2; // Using stream.value directly
          });

          return {
            numberStream$,
            computedValue,
            callCount: ref(computedCallCount),
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Verify initial computed calculation
      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 10",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 20",
      );
      expect(computedCallCount).toBe(1);

      // Update stream and verify computed recalculation
      numberStream$.next(15);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 15",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 30",
      );
      expect(computedCallCount).toBe(2);

      // Another update
      numberStream$.next(25);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 25",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 50",
      );
      expect(computedCallCount).toBe(3);
    });

    it("stream ref property should trigger computed recalculation using stream.value directly", async () => {
      // Test stream's native reactivity with Vue computed
      const numberStream$ = $(10);
      let computedCallCount = 0;

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-computed-container">
            <div data-testid="original-value">Original: {{ numberStream$Ref }}</div>
            <div data-testid="computed-value">Computed: {{ computedValue }}</div>
            <div data-testid="call-count">Call Count: {{ callCount }}</div>
          </div>
        `,
        setup() {
          const numberStream$Ref = numberStream$.ref;
          const computedValue = computed(() => {
            computedCallCount++;
            return numberStream$Ref.value * 2; // Using stream.value directly
          });

          return {
            numberStream$Ref,
            computedValue,
            callCount: ref(computedCallCount),
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Verify initial computed calculation
      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 10",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 20",
      );
      expect(computedCallCount).toBe(1);

      // Update stream and verify computed recalculation
      numberStream$.next(15);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 15",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 30",
      );
      expect(computedCallCount).toBe(2);

      // Another update
      numberStream$.next(25);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="original-value"]').text()).toBe(
        "Original: 25",
      );
      expect(wrapper.find('[data-testid="computed-value"]').text()).toBe(
        "Computed: 50",
      );
      expect(computedCallCount).toBe(3);
    });

    it("stream should trigger watch callbacks using stream.value directly", async () => {
      // Test stream's native reactivity with Vue watch
      const dataStream$ = $("initial");
      const watchCallbacks: { newVal: any; oldVal: any }[] = [];

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-watch-container">
            <div data-testid="stream-value">Value: {{ dataStream$.ref.value }}</div>
            <div data-testid="watch-count">Watch triggered: {{ watchCount }} times</div>
          </div>
        `,
        setup() {
          const watchCount = ref(0);

          // Watch the stream.value directly
          watch(
            () => dataStream$.ref.value,
            (newVal, oldVal) => {
              watchCallbacks.push({ newVal, oldVal });
              watchCount.value++;
            },
            { immediate: false }, // Don't trigger on initial setup
          );

          return {
            dataStream$,
            watchCount,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state - watch should not have been triggered yet
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: initial",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 0 times",
      );
      expect(watchCallbacks).toHaveLength(0);

      // First update
      dataStream$.next("updated1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: updated1",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 1 times",
      );
      expect(watchCallbacks).toHaveLength(1);
      expect(watchCallbacks[0]).toEqual({
        newVal: "updated1",
        oldVal: "initial",
      });

      // Second update
      dataStream$.next("updated2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: updated2",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 2 times",
      );
      expect(watchCallbacks).toHaveLength(2);
      expect(watchCallbacks[1]).toEqual({
        newVal: "updated2",
        oldVal: "updated1",
      });
    });

    it("stream ref property should trigger watch callbacks using stream.value directly", async () => {
      // Test stream's native reactivity with Vue watch
      const dataStream$ = $("initial");
      const watchCallbacks: { newVal: any; oldVal: any }[] = [];

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-watch-container">
            <div data-testid="stream-value">Value: {{ dataStream$Ref }}</div>
            <div data-testid="watch-count">Watch triggered: {{ watchCount }} times</div>
          </div>
        `,
        setup() {
          const dataStream$Ref = dataStream$.ref;
          const watchCount = ref(0);

          // Watch the stream.value directly
          watch(
            () => dataStream$Ref.value,
            (newVal, oldVal) => {
              watchCallbacks.push({ newVal, oldVal });
              watchCount.value++;
            },
            { immediate: false }, // Don't trigger on initial setup
          );

          return {
            dataStream$Ref,
            watchCount,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state - watch should not have been triggered yet
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: initial",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 0 times",
      );
      expect(watchCallbacks).toHaveLength(0);

      // First update
      dataStream$.next("updated1");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: updated1",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 1 times",
      );
      expect(watchCallbacks).toHaveLength(1);
      expect(watchCallbacks[0]).toEqual({
        newVal: "updated1",
        oldVal: "initial",
      });

      // Second update
      dataStream$.next("updated2");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Value: updated2",
      );
      expect(wrapper.find('[data-testid="watch-count"]').text()).toBe(
        "Watch triggered: 2 times",
      );
      expect(watchCallbacks).toHaveLength(2);
      expect(watchCallbacks[1]).toEqual({
        newVal: "updated2",
        oldVal: "updated1",
      });
    });

    it("stream should work with Vue ref using native reactivity", async () => {
      // Test stream's native reactivity working alongside Vue ref
      const stream$ = $(100);

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-reactive-composition">
            <div data-testid="stream-value">Stream: {{ stream$.ref.value }}</div>
            <div data-testid="ref-value">Ref: {{ refValue }}</div>
            <div data-testid="combined-computed">Combined: {{ combinedValue }}</div>
            <button @click="updateRef" data-testid="update-ref-btn">Update Ref</button>
          </div>
        `,
        setup() {
          const refValue = ref(50);

          const combinedValue = computed(() => {
            return stream$.ref.value + refValue.value; // Using stream.value directly
          });

          const updateRef = () => {
            refValue.value += 10;
          };

          return {
            stream$,
            refValue,
            combinedValue,
            updateRef,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 100",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 50");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 150",
      );

      // Update stream - should trigger computed recalculation
      stream$.next(200);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 200",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 50");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 250",
      );

      // Update ref - should also trigger computed recalculation
      await wrapper.find('[data-testid="update-ref-btn"]').trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 200",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 60");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 260",
      );

      // Update both
      stream$.next(300);
      await wrapper.find('[data-testid="update-ref-btn"]').trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 300",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 70");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 370",
      );
    });

    it("stream ref property should work with Vue ref using native reactivity", async () => {
      // Test stream's native reactivity working alongside Vue ref
      const stream$ = $(100);

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-reactive-composition">
            <div data-testid="stream-value">Stream: {{ stream$Ref }}</div>
            <div data-testid="ref-value">Ref: {{ refValue }}</div>
            <div data-testid="combined-computed">Combined: {{ combinedValue }}</div>
            <button @click="updateRef" data-testid="update-ref-btn">Update Ref</button>
          </div>
        `,
        setup() {
          const stream$Ref = stream$.ref;
          const refValue = ref(50);

          const combinedValue = computed(() => {
            return stream$Ref.value + refValue.value; // Using stream.value directly
          });

          const updateRef = () => {
            refValue.value += 10;
          };

          return {
            stream$Ref,
            refValue,
            combinedValue,
            updateRef,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state
      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 100",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 50");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 150",
      );

      // Update stream - should trigger computed recalculation
      stream$.next(200);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 200",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 50");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 250",
      );

      // Update ref - should also trigger computed recalculation
      await wrapper.find('[data-testid="update-ref-btn"]').trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 200",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 60");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 260",
      );

      // Update both
      stream$.next(300);
      await wrapper.find('[data-testid="update-ref-btn"]').trigger("click");
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="stream-value"]').text()).toBe(
        "Stream: 300",
      );
      expect(wrapper.find('[data-testid="ref-value"]').text()).toBe("Ref: 70");
      expect(wrapper.find('[data-testid="combined-computed"]').text()).toBe(
        "Combined: 370",
      );
    });

    it("multiple streams should work with complex computed using native reactivity", async () => {
      // Test multiple streams in computed dependencies using native reactivity
      const priceStream$ = $(100);
      const quantityStream$ = $(2);
      const discountStream$ = $(0.1); // 10% discount

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-complex-computed">
            <div data-testid="price">Price: {{ priceStream$.ref.value }}</div>
            <div data-testid="quantity">Quantity: {{ quantityStream$.ref.value }}</div>
            <div data-testid="discount">Discount: {{ discountPercentage }}%</div>
            <div data-testid="subtotal">Subtotal: {{ subtotal }}</div>
            <div data-testid="total">Total: {{ finalTotal }}</div>
          </div>
        `,
        setup() {
          const discountPercentage = computed(() => {
            return (discountStream$.ref.value * 100).toFixed(1); // Using stream.value directly
          });

          const subtotal = computed(() => {
            return priceStream$.ref.value * quantityStream$.ref.value; // Using stream.value directly
          });

          const finalTotal = computed(() => {
            const sub = subtotal.value;
            return sub * (1 - discountStream$.ref.value); // Using stream.value directly
          });

          return {
            priceStream$,
            quantityStream$,
            discountStream$,
            discountPercentage,
            subtotal,
            finalTotal,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial calculation: 100 * 2 * (1 - 0.1) = 180
      expect(wrapper.find('[data-testid="price"]').text()).toBe("Price: 100");
      expect(wrapper.find('[data-testid="quantity"]').text()).toBe(
        "Quantity: 2",
      );
      expect(wrapper.find('[data-testid="discount"]').text()).toBe(
        "Discount: 10.0%",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 200",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 180");

      // Update price: 150 * 2 * (1 - 0.1) = 270
      priceStream$.next(150);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="price"]').text()).toBe("Price: 150");
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 300",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 270");

      // Update quantity: 150 * 3 * (1 - 0.1) = 405
      quantityStream$.next(3);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="quantity"]').text()).toBe(
        "Quantity: 3",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 450",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 405");

      // Update discount: 150 * 3 * (1 - 0.2) = 360
      discountStream$.next(0.2);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="discount"]').text()).toBe(
        "Discount: 20.0%",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 450",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 360");
    });

    it("multiple streams ref property should work with complex computed using native reactivity", async () => {
      // Test multiple streams in computed dependencies using native reactivity
      const priceStream$ = $(100);
      const quantityStream$ = $(2);
      const discountStream$ = $(0.1); // 10% discount

      const TestComponent = defineComponent({
        template: `
          <div data-testid="native-complex-computed">
            <div data-testid="price">Price: {{ priceStream$Ref }}</div>
            <div data-testid="quantity">Quantity: {{ quantityStream$Ref }}</div>
            <div data-testid="discount">Discount: {{ discountPercentage }}%</div>
            <div data-testid="subtotal">Subtotal: {{ subtotal }}</div>
            <div data-testid="total">Total: {{ finalTotal }}</div>
          </div>
        `,
        setup() {
          const priceStream$Ref = priceStream$.ref;
          const quantityStream$Ref = quantityStream$.ref;
          const discountStream$Ref = discountStream$.ref;
          const discountPercentage = computed(() => {
            return (discountStream$Ref.value * 100).toFixed(1); // Using stream.value directly
          });

          const subtotal = computed(() => {
            return priceStream$Ref.value * quantityStream$Ref.value; // Using stream.value directly
          });

          const finalTotal = computed(() => {
            const sub = subtotal.value;
            return sub * (1 - discountStream$Ref.value); // Using stream.value directly
          });

          return {
            priceStream$Ref,
            quantityStream$Ref,
            discountStream$Ref,
            discountPercentage,
            subtotal,
            finalTotal,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial calculation: 100 * 2 * (1 - 0.1) = 180
      expect(wrapper.find('[data-testid="price"]').text()).toBe("Price: 100");
      expect(wrapper.find('[data-testid="quantity"]').text()).toBe(
        "Quantity: 2",
      );
      expect(wrapper.find('[data-testid="discount"]').text()).toBe(
        "Discount: 10.0%",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 200",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 180");

      // Update price: 150 * 2 * (1 - 0.1) = 270
      priceStream$.next(150);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="price"]').text()).toBe("Price: 150");
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 300",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 270");

      // Update quantity: 150 * 3 * (1 - 0.1) = 405
      quantityStream$.next(3);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="quantity"]').text()).toBe(
        "Quantity: 3",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 450",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 405");

      // Update discount: 150 * 3 * (1 - 0.2) = 360
      discountStream$.next(0.2);
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="discount"]').text()).toBe(
        "Discount: 20.0%",
      );
      expect(wrapper.find('[data-testid="subtotal"]').text()).toBe(
        "Subtotal: 450",
      );
      expect(wrapper.find('[data-testid="total"]').text()).toBe("Total: 360");
    });

    it("stream with object properties should trigger reactivity on property access", async () => {
      // Test stream's native reactivity with object properties
      const userStream$ = $({
        name: "John",
        age: 25,
        email: "john@example.com",
      });

      const TestComponent = defineComponent({
        template: `
          <div data-testid="object-reactive-container">
            <div data-testid="user-name">Name: {{ userName }}</div>
            <div data-testid="user-age">Age: {{ userAge }}</div>
            <div data-testid="user-email">Email: {{ userEmail }}</div>
            <div data-testid="user-info">Info: {{ userInfo }}</div>
          </div>
        `,
        setup() {
          const userName = computed(() => userStream$.ref.value.name);
          const userAge = computed(() => userStream$.ref.value.age);
          const userEmail = computed(() => userStream$.ref.value.email);
          const userInfo = computed(() => {
            const user = userStream$.ref.value;
            return `${user.name} (${user.age}) - ${user.email}`;
          });

          return {
            userName,
            userAge,
            userEmail,
            userInfo,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state
      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: John",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 25");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: john@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: John (25) - john@example.com",
      );

      // Update user object
      userStream$.next({ name: "Alice", age: 30, email: "alice@example.com" });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: Alice",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 30");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: alice@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: Alice (30) - alice@example.com",
      );

      // Another update
      userStream$.next({ name: "Bob", age: 35, email: "bob@example.com" });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: Bob",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 35");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: bob@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: Bob (35) - bob@example.com",
      );
    });

    it("stream ref property with object properties should trigger reactivity on property access", async () => {
      // Test stream's native reactivity with object properties
      const userStream$ = $({
        name: "John",
        age: 25,
        email: "john@example.com",
      });

      const TestComponent = defineComponent({
        template: `
          <div data-testid="object-reactive-container">
            <div data-testid="user-name">Name: {{ userName }}</div>
            <div data-testid="user-age">Age: {{ userAge }}</div>
            <div data-testid="user-email">Email: {{ userEmail }}</div>
            <div data-testid="user-info">Info: {{ userInfo }}</div>
          </div>
        `,
        setup() {
          const userStream$Ref = userStream$.ref;

          const userName = computed(() => userStream$Ref.value.name);
          const userAge = computed(() => userStream$Ref.value.age);
          const userEmail = computed(() => userStream$Ref.value.email);
          const userInfo = computed(() => {
            const user = userStream$Ref.value;
            return `${user.name} (${user.age}) - ${user.email}`;
          });

          return {
            userName,
            userAge,
            userEmail,
            userInfo,
          };
        },
      });

      const wrapper = mount(TestComponent);

      // Initial state
      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: John",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 25");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: john@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: John (25) - john@example.com",
      );

      // Update user object
      userStream$.next({ name: "Alice", age: 30, email: "alice@example.com" });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: Alice",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 30");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: alice@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: Alice (30) - alice@example.com",
      );

      // Another update
      userStream$.next({ name: "Bob", age: 35, email: "bob@example.com" });
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="user-name"]').text()).toBe(
        "Name: Bob",
      );
      expect(wrapper.find('[data-testid="user-age"]').text()).toBe("Age: 35");
      expect(wrapper.find('[data-testid="user-email"]').text()).toBe(
        "Email: bob@example.com",
      );
      expect(wrapper.find('[data-testid="user-info"]').text()).toBe(
        "Info: Bob (35) - bob@example.com",
      );
    });
  });
});
