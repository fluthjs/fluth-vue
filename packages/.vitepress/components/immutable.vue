<template>
  <div
    style="
      display: flex;
      justify-content: space-between;
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 5px;
    "
  >
    <div></div>
    <button
      class="immutable-button"
      @click="data$.set((value) => value.nest.age++)"
    >
      add age for fluth: {{ computedData.nest.age }}
    </button>
    <button class="immutable-button" @click="data.nest.age++">
      add age for ref: {{ data.nest.age }}
    </button>
    <div></div>
  </div>
</template>

<script setup lang="tsx">
import { $, toComp, consoleNode } from "../../core/useFluth/index";
import { ref, watch } from "vue";

defineOptions({
  name: "immutable",
});

const data = ref({ nest: { name: "fluth", age: 0 } });
watch(
  data,
  (newVal) => {
    console.log("ref value", newVal);
  },
  { deep: true },
);

const data$ = $({ nest: { name: "fluth", age: 0 } }).use(
  consoleNode("fluth value"),
);
const computedData = toComp(data$);
</script>

<style lang="scss" scoped>
.immutable-button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
}
</style>
