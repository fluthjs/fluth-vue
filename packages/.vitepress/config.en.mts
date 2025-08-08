export default {
  label: "English(AI)",
  lang: "en",
  title: "fluth-vue",
  description: " Streaming Reactive Programming For Vue",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/en/guide/introduce" },
      { text: "API", link: "/en/useFluth/index.html" },
      {
        text: "changelog",
        link: "https://github.com/fluthjs/fluth-vue/blob/master/CHANGELOG.md",
      },
      { text: "fluth", link: "https://fluthjs.github.io/fluth-doc/" },
    ],
    sidebar: {
      "/en/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/en/guide/introduce" },
            { text: "Why", link: "/en/guide/motion" },
            { text: "Quick", link: "/en/guide/quick" },
            { text: "Debug", link: "/en/guide/debug" },
            { text: "Reactive", link: "/en/guide/reactive" },
            { text: "Render", link: "/en/guide/render" },
            { text: "Immutable", link: "/en/guide/immutable" },
            { text: "Pinia Integration", link: "/en/guide/pinia" },
          ],
        },
        {
          text: "API",
          items: [
            {
              text: "fluth",
              link: "/en/useFluth/index.html",
            },
            {
              text: "useFetch",
              items: [
                { text: "API", link: "/en/useFetch/api.html" },
                { text: "Introduction", link: "/en/useFetch/introduce.html" },
                { text: "Usage", link: "/en/useFetch/use.html" },
                { text: "Cache", link: "/en/useFetch/cache.html" },
                { text: "Refresh", link: "/en/useFetch/refresh.html" },
                { text: "Condition", link: "/en/useFetch/condition.html" },
                { text: "Retry", link: "/en/useFetch/retry.html" },
                { text: "Debounce", link: "/en/useFetch/debounce.html" },
                { text: "Throttle", link: "/en/useFetch/throttle.html" },
                { text: "Stream", link: "/en/useFetch/stream.html" },
              ],
            },
          ],
        },
      ],
    },
  },
};
