import { defineConfig } from "vitepress";

import cnConfig from "./config.cn.mjs";
import enConfig from "./config.en.mjs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "fluth-vue",
  description: "Fluth Composition Utilities Collection For Vue",
  base: "/fluth-vue/",
  locales: {
    en: enConfig,
    cn: cnConfig,
  },
  markdown: {
    theme: "github-dark",
  },
  head: [
    ["link", { rel: "icon", href: "/fluth-vue/favicon.ico" }],
    [
      "link",
      {
        rel: "icon",
        href: "/fluth-vue/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  ],
  rewrites: {
    "core/:pkg/{:name}.cn.md": "cn/:pkg/{:name}.md",
    "core/:pkg/:file/{:name}.cn.md": "cn/:pkg/{:name}.md",
    "core/:pkg/{:name}.en.md": "en/:pkg/{:name}.md",
    "core/:pkg/:file/{:name}.en.md": "en/:pkg/{:name}.md",
    "guide/index.{:name}.md": "{:name}/index.md",
    "guide/{:name}.cn.md": "cn/guide/{:name}.md",
    "guide/{:name}.en.md": "en/guide/{:name}.md",
  },
  themeConfig: {
    logo: "/logo.svg",
    outline: "deep",
    socialLinks: [
      { icon: "github", link: "https://github.com/fluthjs/fluth-vue" },
    ],
  },
});
