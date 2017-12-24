# PutongOJ-FE

[Putong OJ](https://github.com/lazzzis/PutongOJ) 的前端部分

[Preview](http://acm.cjlu.edu.cn)

一个采用 vue, vue-router, vuex 而成的单页应用

# 主要组件的版本
- Vue 2.3.2
- vue-router 2.5.3
- vuex 2.3.1
- axios 0.16.1

# 项目结构

```
├── dist // 生成打包好的文件
│   ├── fonts
│   └── images
└── src
    │   main.js // 项目入口
    │   router.js // 路由文件，说明了各个路由将会使用的组件
    │
    ├── assets // 主要是 sass 文件，本项目的大部分 css 样式集中于此
    │   ├── bulma-0.4.1 // 本项目在 bulma 基础上做了一些自定义修改，bulma 项目地址 https://bulma.io
    │   └── utils
    ├── components // 一些小组件
    ├── store // vuex 文件
    │   └── modules // 子模块
    └── views // 路由对应的组件 (这些组件在 router.js 中都被引入)
        ├── Admin
        ├── Contest
        └── User

```

# TODO

- [ ] 开发文档
