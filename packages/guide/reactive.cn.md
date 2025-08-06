# 响应式

fluth 提供了强大的响应式功能，让流能够与 Vue 的响应式系统无缝集成

fluth 提供了 [to$](/cn/useFluth/#to$) 方法，可以将 Vue 的响应式数据转换为流。

流提供了 [ref](/cn/useFluth/#ref) 属性，可以和原生 ref 一样触发 Vue 模板的动态渲染、computed 的重新计算以及 watch 的回调执行。

流提供了 [toCompt](/cn/useFluth/#tocompt) 方法，可以将流的值转换为 computed 对象。

::: tip 注意

不应该使用 v-model 来绑定流的响应式数据，修改了流的响应式数据不会触发流的订阅，当流的上游推送数据后，也会将修改的数据覆盖了。

:::

## 响应式和数据的解耦

使用 ref 或者 reactive 的时候，数据和响应式是一体的，修改了数据就会触发响应式，没有办法做到条件响应式，比如：

```typescript
// wineList 会被外部频繁的修改
const wineList = ref(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age = ref(0);
const availableWineList = computed(() => {
  age.value > 18 ? wineList.value : [];
});
```

如果想只有在年龄发生变化的时候获取一下 wineList 的最新值，年龄不变的时候不响应 wineList 的修改，computed 则无法做到。

当然可以采用 watch + 缓存来达到这个效果：

```typescript
// wineList 会被外部频繁的修改
const wineList = ref(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age = ref(0);
const availableWineList = ref<string[]>([]);

watch(
  () => age.value,
  (newVal) => {
    if (newVal > 18) {
      availableWineList.value = wineList.value.slice();
    }
  },
);
```

但是这样写代码丑陋还需要额外的缓存 availableWineList，使用 fluth 流式编程则可以很好的对数据和响应式进行解耦：

```typescript
const wineList = $(["Red Wine", "White Wine", "Sparkling Wine", "Rosé Wine"]);

const age$ = $(0);
const availableWineList = age$
  .pipe(filter((age) => age > 18))
  .then(() => wineList.value).ref;
```

只有 age 大于 18 的时候，才可以获取到 wineList 的最新值，但是后续 wineList 的 immutable 修改不会触发 availableWineList 的重新计算以及值。
