export default {
  label: "简体中文",
  lang: "cn",
  title: "fluth-vue",
  description: "基于 fluth 的 Vue Composition 工具集合",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "指南", link: "/cn/guide/introduce" },
      { text: "API", link: "/cn/useFluth/index.html" },
      {
        text: "changelog",
        link: "https://github.com/fluthjs/fluth-vue/blob/master/CHANGELOG.md",
      },
      { text: "fluth", link: "https://fluthjs.github.io/fluth-doc/" },
    ],
    sidebar: {
      "/cn/": [
        {
          text: "指南",
          items: [
            { text: "简介", link: "/cn/guide/introduce" },
            { text: "动机", link: "/cn/guide/motion" },
            { text: "上手", link: "/cn/guide/quick" },
            { text: "进阶", link: "/cn/guide/advance" },
          ],
        },
        {
          text: "API",
          items: [
            {
              text: "fluth",
              link: "/cn/useFluth/index.html",
              items: [
                { text: "to$", link: "/cn/useFluth/to$.html" },
                { text: "toComp", link: "/cn/useFluth/toComp.html" },
                { text: "toComps", link: "/cn/useFluth/toComps.html" },
              ],
            },
            {
              text: "useFetch",
              items: [
                { text: "API", link: "/cn/useFetch/api.html" },
                { text: "介绍", link: "/cn/useFetch/introduce.html" },
                { text: "用法", link: "/cn/useFetch/use.html" },
                { text: "缓存", link: "/cn/useFetch/cache.html" },
                { text: "更新", link: "/cn/useFetch/refresh.html" },
                { text: "条件", link: "/cn/useFetch/condition.html" },
                { text: "重试", link: "/cn/useFetch/retry.html" },
                { text: "防抖", link: "/cn/useFetch/debounce.html" },
                { text: "节流", link: "/cn/useFetch/throttle.html" },
                { text: "推流", link: "/cn/useFetch/stream.html" },
              ],
            },
          ],
        },
      ],
    },
  },
};
