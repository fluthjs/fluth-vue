<template>
  <div
    style="
      display: flex;
      justify-content: space-between;
      border: 1px solid #ccc;
      padding: 30px;
      margin: 30px 0;
      border-radius: 5px;
    "
  >
    <div></div>
    <button class="immutable-button" @click="updateData$">
      data$ value + 1
    </button>
    <div></div>
  </div>
</template>

<script setup lang="tsx">
import { $, debugAll } from "../../core/useFluth/index";

const data$ = $().use(debugAll());

data$.then((value) => value + 1).then((value) => value + 1);

const updateData$ = () => {
  data$.next(data$.value + 1);
};
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
.dark {
  .immutable-button {
    background-color: #3a3f54;
    border: 1px solid #3a3f54;
    &:hover {
      background-color: #35394a;
    }
  }
}
</style>
