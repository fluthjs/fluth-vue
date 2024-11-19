export default {
  label: "English",
  lang: "en",
  title: "fluth-vue",
  description: "a javascript promise stream library",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Guide", link: "/en/guide/introduce" },
      { text: "API", link: "/en/useFluth/index.html" },
      { text: "changelog", link: "https://github.com/fluthjs/fluth-vue/blob/master/CHANGELOG.md" },
      { text: "fluth", link: "https://fluthjs.github.io/fluth-doc/" },
    ],
    sidebar: {
      "/en/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/en/guide/introduce" },
            { text: "Quick Start", link: "/en/guide/quick" },
          ],
        },
        {
          text: "API",
          items: [
            { text: "Stream", link: "/en/useFluth/index.html" },
            {
              text: "useFetch",
              items: [
                { text: "Introduction", link: "/en/useFetch/introduce.html" },
                { text: "Usage", link: "/en/useFetch/use.html" },
                { text: "Cache", link: "/en/useFetch/cache.html" },
                { text: "Refresh", link: "/en/useFetch/refresh.html" },
                { text: "Condition", link: "/en/useFetch/condition.html" },
                { text: "Debounce", link: "/en/useFetch/debounce.html" },
                { text: "Throttle", link: "/en/useFetch/throttle.html" },
                { text: "Stream", link: "/en/useFetch/stream.html" },
                { text: "API", link: "/en/useFetch/api.html" },
              ],
            },
          ],
        },
      ],
    },
  },
};
