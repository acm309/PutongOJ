# PutongOJ-FE

[Putong OJ](https://github.com/acm309/PutongOJ) 的前端部分

[Preview](http://acm.cjlu.edu.cn)

一个采用 vue, vue-router, vuex 而成的单页应用

# 主要组件的版本
- Vue 2.5.2
- vue-router 3.0.1
- vuex 3.0.1
- axios 0.17.1
- iview 2.8.0

# 项目结构

```
├── dist // 生成打包好的文件
│   ├── static
|   |   ├── css
|   |   ├── fonts
|   |   ├── img
|   |   └── js
│   └── index.html
└── src
    ├── main.js // 项目入口
    ├── router // 路由文件，说明了各个路由将会使用的组件
    |   ├── index.js // router的配置以及引用组件
    |   └── routes.js // 定义各个路由
    ├── assets // 网站logo图资源
    ├── components // 一些小组件
    ├── store // vuex 文件
    │   └── modules // 子模块
    └── views // 路由对应的组件 (这些组件在 router.js 中都被引入)
        ├── Admin
        ├── Contest
        ├── News
        └── Problem

```

# 修改颜色

- src/my-theme/index.less
- src/styles/common.styl

# TODO

- [ ] 开发文档
