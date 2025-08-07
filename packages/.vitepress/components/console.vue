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
      data$ value +1
    </button>
    <div></div>
  </div>
</template>

<script setup lang="tsx">
import { $, consoleAll, debounce } from "../../core/useFluth/index";

const data$ = $().use(consoleAll());
data$
  .pipe(debounce(300))
  .then((value) => {
    throw new Error(value + 1);
  })
  .then(undefined, (error) => ({ current: error.message }));

const updateData$ = () => {
  data$.next(1);
};
</script>

<style lang="scss" scoped>
.immutable-button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  background: #fff;
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
