import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Putong OJ Docs",
  description: "Putong OJ Documentation",
  lang: "zh-CN",
  base: "/docs/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/net-escape/ptoj-backend' }
    ]
  }
})
