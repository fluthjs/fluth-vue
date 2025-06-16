import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";

export default defineConfig({
  test: {
    environment: "jsdom",
    reporters: "basic",
  },
  plugins: [vue(), vueJsx()],
});
