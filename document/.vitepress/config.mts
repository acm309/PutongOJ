import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Putong OJ Docs',
  description: 'Putong OJ Documentation',
  lang: 'zh-CN',
  base: '/docs/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '文档首页', link: '/' },
    ],
    sidebar: [
      {
        text: '基础', items: [
          { text: '常见问题', link: '/faq' },
          { text: 'Frequently Asked Questions', link: '/faq-en' },
        ]
      },
      {
        text: '题目',
        items: [
          { text: '特判（Special Judge）', link: '/user/special-judge' },
          { text: '交互题（Interaction）', link: '/user/interaction' },
        ],
      },
      {
        text: '其它',
        items: [
          { text: 'Markdown 示例', link: '/markdown-examples' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/net-escape/ptoj-backend' },
    ],
  },
})
