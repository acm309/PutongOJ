# 测试方案构想

对于需要分权限测试的 controller 下，一般有三种文件:

- visitor.test.js
- user.test.js
- admin.test.js

`admin.test.js`: 仅测试需要 admin 权限才能运行的操作: 比如增删题目
`user.test.js`: 测试必须要登录，但仅需一般权限的操作
`visitor.test.js`: 测试不需要登录就可以进行的操作


等 coverage 达到 80% 就在项目 README 里放上吧

[![Codecov](https://img.shields.io/codecov/c/github/acm309/PutongOJ.svg?style=flat-square)](https://codecov.io/gh/acm309/PutongOJ)
