import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Putong OJ Docs',
  description: 'Putong OJ Documentation',
  srcDir: './src',
  lang: 'zh-CN',
  base: '/docs/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '常见问题', link: '/faq' },
      { text: '开发团队', link: '/team' },
      { text: '前往主站', link: 'https://acm.cjlu.edu.cn' },
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
          { text: '特判 (Special Judge)', link: '/problem/special-judge' },
          { text: '交互题 (Interaction)', link: '/problem/interaction' },
        ],
      },
      {
        text: '其它',
        items: [
          { text: '开发团队', link: '/team' },
          { text: 'Markdown 示例', link: '/markdown-examples' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/acm309/PutongOJ' },
    ],
    editLink: {
      pattern: 'https://github.com/acm309/PutongOJ/tree/main/document/:path'
    },
  },
})
