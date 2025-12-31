---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Putong OJ"
  text: "Documentation"
  tagline: 一个普通的在线评判系统和她普通的文档。
  actions:
    - theme: brand
      text: 常见问题
      link: /faq
    - theme: alt
      text: Frequently Asked Questions
      link: /faq-en

features:
  - title: 特判
    details: 特判程序用于处理多解题目或允许误差范围的情况。
    link: /problem/special-judge
    linkText: 了解更多
  - title: 交互题
    details: 交互题是一种特殊的编程题型，要求选手编写的程序与评测系统进行动态交互。
    link: /problem/interaction
    linkText: 了解更多
---

<style>
  :root {
    --vp-home-hero-name-color: transparent;
    --vp-home-hero-name-background: -webkit-linear-gradient(120deg, oklch(60.6% 0.25 292.717), oklch(59.1% 0.293 322.896));
  }
</style>
