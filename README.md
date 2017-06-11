# Putong OJ

![node version](https://img.shields.io/badge/node-%3E%3D%20v7.6.0-brightgreen.svg?style=flat-square) ![Operating System](https://img.shields.io/badge/OS-Linux-brightgreen.svg?style=flat-square)

[DEMO](http://acm.cjlu.edu.cn)

# Installation

## 前提

本 OJ 仅适用于 Linux 平台

## 安装 Node.js

要求 Node.js 版本大于等于 7.6.0。如果低于此版本，就请更新。

如果没有安装过 Node.js，可以参考 [官网](https://nodejs.org/en/) 或这篇 [博客](https://my.oschina.net/blogshi/blog/260953)。

## 安装依赖

在项目的根目录处
```bash
npm i
```

## 安装 redis

参考 [官网](https://redis.io/topics/quickstart) 即可安装， 并用 `redis-server` 启动它

## 安装 mongodb

仍然安装 [官网](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/) 安装即可，并用 `mongod` 启动它

## 编译判题端

```bash
cd data/Judger
g++ core.cpp -o Core -O2
```

## 恢复数据

在 `data/DB` 下有一份默认的数据，可以考虑使用

```bash
cd data/DB
mongorestore --db oj --drop oj
```

# 启动

## config

配置 `config/index.js` 文件

主要是以下几个属性需要特别注意

```js
port: 3000 // 服务端的端口
redisUrl: 'redis://localhost:6379' // redis 的连接字符串
mongoUrl: 'mongodb://localhost:27017/oj' // mongodb 的连接字符串
```

## Start

输入以下命令及启动

```bash
npm run start
```

## 判题端

1.
```sh
cd data/Judger
sudo node judger.js
# 需要 root 权限
```

2.
```sh
cd data/RanklistUpdater
node updater.js
```

# TODO

- [ ] 说明文档
- [ ] 开发文档
- [ ] 打包成 docker
