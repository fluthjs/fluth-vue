<template>
  <div>hello</div>
</template>

<script setup lang="tsx">
import { Stream } from "../index";
defineOptions({
  name: "FluthTest",
});

const props = withDefaults(
  defineProps<{
    stream?: Stream;
  }>(),
  { stream: undefined },
);

props.stream?.then((value) => console.log(value));
</script>

<style lang="scss" scoped></style>
