# Putong Online Judge v2

> README is currently outdated, please relax, we are working on it.

> (初代版本 [here](https://github.com/acm309/PutongOJ/tree/v1))

> (English [here](./README_en.md))

[![Build Status](https://img.shields.io/github/workflow/status/acm309/PutongOJ/Node.js%20CI?style=flat-square)](https://github.com/acm309/PutongOJ/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/acm309/PutongOJ.svg?style=flat-square)](https://codecov.io/gh/acm309/PutongOJ)
[![Node](https://img.shields.io/badge/node-%3E=16.0.0-ff69b4.svg?style=flat-square)](https://nodejs.org/en/download/releases/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

### 预览

[Demo](http://acm.cjlu.edu.cn) (测试账号: 123456 / 123456)

## 文档

Currently Not available
如果问题，请直接在发起一个 issue。

## Features

- Docker 构建，一件部署
- 单页应用
- 多组测试样例
- Powered by Vue.js, Koa.js, MongoDB, Redis

## 部署

注意，此 OJ 处于 beta 状态。

### Docker

1. 复制此仓库

```bash
git clone https://github.com/acm309/PutongOJ.git PutongOJ
```

2. 配置环境变量

```bash
mv .env.sample .env
```

3. compose up

```bash
docker-compose up
```

or

daemon mode
```bash
docker-compose up -d
```

会在 80 端口启动。可以直接访问。默认管理员账户 `admin`, 密码 `kplkplkpl`

Enjoy it!

### 手动安装

推荐安装在 Ubuntu 上。可以尝试其他版本，但不保证稳定。

1. 安装 [Node.js](https://nodejs.org) [mongodb](https://www.mongodb.com/download-center?jmp=nav#community) && [redis](https://redis.io/)

2. 安装其它依赖 (for ubuntu)

```bash
apt-get install libcairo2-dev libpango1.0-dev build-essential
```

3. 复制此仓库

```bash
git clone https://github.com/acm309/PutongOJ.git
```

4. 安装项目依赖

```bash
npm i -g pnpm
pnpm i
```

5. 配置环境变量

```bash
mv .env.sample .env
```

```bash
redisURL='your redis url'
dbURL='your mongodb url'
port=3000 #the port the application will listen on
```

6. 下载静态文件和启动判题端

```bash
node manager.js setup
```

`pm2.config.json` 会自动生成.

7. 启动

安装 pm2

```bash
npm i -g pm2
```

用 pm2 启动

```bash
pm2 start pm2.config.json
```

## 迁移

找到并记住 mongodb 容器的 `Container Id`

```bash
docker ps
```

### 导出

将 `<Container id>` 替换为上一步中 mongodb 实际运行的 id

```bash
docker exec -it <Container id> mongodump --out /data/backup --db oj
```

数据会在 `migrations/backup/`

### 恢复

```bash
docker exec -it <Container Id> mongorestore --db oj --drop /data/backup/oj
```

### 静态文件

将文件复制到 `public`

将 `<Container id>` 替换为 oj 系统在运行的容器 id

```bash
docker cp <SRC_PATH> <Container Id>:/app/public
```

## Browser Support

- IE: **NOT** recommended
- Chrome: 50 or above is recommended
- Firefox: 50 or above is recommended
- Edge: recommended

## LICENSE

[MIT](https://github.com/acm309/PutongOJ/blob/master/LICENSE)
