# Putong OJ 数据迁移运维手册

本目录是 Putong OJ 的运维命令行应用。它用于将 MongoDB 中的历史数据
迁移到 PostgreSQL；**不得**将它作为 Web 服务或 worker 的运行时依赖。

## 适用范围

- 从当前 MongoDB / Mongoose 架构迁移至 PostgreSQL / Prisma 架构。
- 迁移包含用户、群组、题目、课程、比赛、讨论、文件、OAuth、文章、
  设置、提交记录及测试点结果。
- 题目测试数据不写入数据库，继续保留在：

  ```text
  apps/server/data/<problemId>/
  ```

## 前提条件

1. 运行 CLI 的机器必须能访问 MongoDB 与 PostgreSQL。
2. 使用的 Node.js、PNPM 版本应满足根 `package.json` 的 engines 要求。
3. PostgreSQL 目标库已执行仓库 migration：

   ```sh
   pnpm db:deploy
   ```

4. 迁移期间必须停止旧服务所有写入入口，包括 HTTP API、WebSocket
   关联写入、worker、updater 和任何外部管理脚本。
5. 完整导入会清空目标 PostgreSQL 表；目标库不得承载需要保留的数据。

## 环境变量

CLI 优先从 `apps/cli/.env*` 加载环境变量。

```dotenv
PTOJ_MONGODB_URL=mongodb://mongo-host:27017/oj
DATABASE_URL=postgresql://user:password@postgres-host:5432/putong_oj
```

未设置 `PTOJ_MONGODB_URL` 时，本地开发默认使用：

```text
mongodb://localhost:27017/oj
```

生产迁移必须显式配置两个连接串，避免误连本地数据库。

## 推荐生产流程

### 1. 备份

在停机前分别完成：

- MongoDB 一致性备份；
- PostgreSQL 目标库备份或确认其可安全重建；
- `apps/server/data/`、上传目录及部署配置备份。

题目目录以数字题号命名。由于迁移保留题目数字 ID，它们无需改名，但
仍必须与数据库备份一同保存。

### 2. 预检查

验证两端连接：

```sh
pnpm --filter @putongoj/cli start -- check-connections
```

查看源数据集合数量与字段形态：

```sh
pnpm --filter @putongoj/cli start -- inventory
```

执行只读完整性检查：

```sh
pnpm --filter @putongoj/cli start -- audit
```

`audit` 返回非零状态时，不要执行迁移。应先处理输出中的 error。

如需从 PostgreSQL 当前事实数据重建派生统计 projection：

```sh
pnpm --filter @putongoj/cli start -- rebuild-stats
```

可选地限制范围：

```sh
pnpm --filter @putongoj/cli start -- rebuild-stats --scope discussion
```

### 3. 停止写入

进入维护窗口后，停止旧版服务的所有进程。确认 MongoDB 没有新的用户、
提交、比赛参与记录、文件或 OAuth 写入。

### 4. 初始化 PostgreSQL

在目标库上应用已提交的 Prisma migration：

```sh
pnpm db:deploy
```

仅首次创建空目标库时，可使用开发命令：

```sh
pnpm db:migrate -- --name init
```

生产环境不要用 `migrate dev` 创建未知 migration。

### 5. 执行完整迁移

完整迁移会先审计 MongoDB，再清空目标表并按依赖顺序导入：

```sh
pnpm --filter @putongoj/cli start -- migrate --reset-target --confirm
```

必须同时提供两个确认参数。缺少任意一个参数时 CLI 会拒绝执行。

如果仅需要验证第一批基础实体的导入链路，可以使用：

```sh
pnpm --filter @putongoj/cli start -- migrate-base --reset-target --confirm
```

它只迁移用户、群组、群组成员、标签、题目及题目标签。

### 6. 验收

迁移命令完成后：

1. 再次运行 `inventory` 与 `audit`，留存输出；
2. 在 PostgreSQL 目标库运行：

   ```sh
   pnpm --filter @putongoj/cli start -- verify-target
   ```

   该命令输出各表计数，并检查 Submission、测试点结果、相似提交的关键
   外键完整性。返回非零状态时不得切换运行时数据库；

3. 对照源端 inventory、完整迁移 CLI 输出和 target verification 输出；
4. 用新版 server 的集成测试和人工冒烟测试验证登录、题目、提交、比赛、
   课程、讨论、文件与 OAuth；
5. 确认 `apps/server/data/<problemId>/` 目录与迁移后的 `Problem.id`
   一致；
6. 确认无误后再将应用运行时连接切换至 PostgreSQL。

## 回滚

当前迁移模型是停机一次性切换，不做 MongoDB/PostgreSQL 双写。

若验收失败：

1. 不要继续写入 PostgreSQL；
2. 将应用连接恢复到维护前的 MongoDB；
3. 从备份恢复必要的文件系统数据；
4. 记录失败的 CLI 输出、PostgreSQL 日志和迁移版本；
5. 修复迁移程序后，在新的空 PostgreSQL 目标库重新执行完整迁移。

不要尝试手工将 PostgreSQL 的部分数据反向写回 MongoDB。

## 数据处理规则

- 数字业务 ID 会被保留：题目、比赛、课程、群组、标签、讨论、评论、
  提交等。
- `User` 使用新的数字主键，旧 `uid` 保留为唯一用户名。
- `User.gid` 迁为 `GroupMember`；legacy `Group.list` 不作为关系来源。
- 旧 `Solution.status` 不迁移；判题状态来自 `Solution.judge`。
- 旧 `Contest.allowedLanguages` 缺失或为 `null` 时，目标写入空数组，
  表示不限语言。
- 同一比赛中重复出现的同一题目属于历史脏数据。导入时保留第一次出现的
  题目与位置，之后的重复项会被去除。
- 旧备份若含 `Tag.color = gold`，导入时归一为 `YELLOW`；当前产品不再
  对外支持 `gold`。

## 安全注意事项

- CLI 会读取源代码、OAuth token 与 OAuth raw payload。不要将 CLI 的
  完整输出、环境变量或数据库备份上传到公开日志、工单或聊天记录。
- 不要把生产 `.env` 文件、数据库 dump 或迁移报告提交至 Git。
