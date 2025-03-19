const path = require('node:path')
const fse = require('fs-extra')
const send = require('koa-send')
const remove = require('lodash.remove')
const { v4: uuid } = require('uuid')

const loadPID = (ctx) => {
  const pid = Number(ctx.params.pid)
  if (!Number.isInteger(pid) || pid <= 0) {
    ctx.throw(400, 'Invalid problem ID')
  }
  return pid
}

const loadUUID = (ctx) => {
  const uuid = ctx.params.uuid
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(uuid)) {
    ctx.throw(400, 'Invalid UUID')
  }
  return uuid
}

/**
 * 拿到输入输出的测试文件，然后将它移动到专门放测试数据的地方
 * 记得中间要修改对应的 meta.json
 */
const create = async (ctx) => {
  const pid = loadPID(ctx)
  const testin = ctx.request.body.in || ''
  const testout = ctx.request.body.out || ''

  if (!testin && !testout) {
    ctx.throw(400, 'Cannot create testcase without both input and output')
  }

  const testDir = path.resolve(__dirname, `../data/${pid}`)
  const id = uuid() // 快速生成RFC4122 UUID
  // 将文件读取到meta对象
  const meta = await fse.readJson(path.resolve(testDir, 'meta.json'))
  meta.testcases.push({
    uuid: id,
  })
  await Promise.all([
    // 将test.in等文件写入本地文件，如果父级目录不存在(即testDir)，创建它
    fse.outputFile(path.resolve(testDir, `${id}.in`), testin),
    fse.outputFile(path.resolve(testDir, `${id}.out`), testout),
    fse.outputJson(path.resolve(testDir, 'meta.json'), meta, { spaces: 2 }),
  ])
  ctx.body = meta // 结构就是: {testcases: [{ uuid: 'axxx' }, { uuid: 'yyyy' }]}
}

/**
 * 只移除 meta.json 中的对应元素，但并不删除测试数据的文件！
 * 保留测试数据的文件，原因是为了能够继续查看测试样例, 比如 一个提交的测试数据用的是 id 为 1 的测试数据，即时管理员不再用这个数据了，我们仍然能够看到当时这个提交用的测试数据
 */
const del = async (ctx) => {
  const pid = loadPID(ctx)
  const uuid = loadUUID(ctx)

  const testDir = path.resolve(__dirname, `../data/${pid}`)
  const meta = await fse.readJson(path.resolve(testDir, 'meta.json'))
  remove(meta.testcases, item => item.uuid === uuid)
  await fse.outputJson(path.resolve(testDir, 'meta.json'), meta, { spaces: 2 })
  ctx.body = meta
}

/**
 * 这里是将文件返回
 */
const fetch = async (ctx) => {
  const pid = loadPID(ctx)
  const uuid = loadUUID(ctx)
  const type = ctx.query.type
  if (type !== 'in' && type !== 'out') {
    ctx.throw(400, 'Invalid type')
  }

  const testDir = path.resolve(__dirname, `../data/${pid}`)
  if (!fse.existsSync(path.resolve(testDir, `${uuid}.${type}`))) {
    ctx.throw(400, 'No such a testcase')
  }
  ctx.type = 'text/plain; charset=utf-8'
  await send(ctx, `${uuid}.${type}`, { root: testDir })
}

// 返回该题拥有的测试数据
const find = async (ctx) => {
  const pid = loadPID(ctx)

  let meta = { testcases: [] }
  const dir = path.resolve(__dirname, `../data/${pid}`)
  const file = path.resolve(dir, 'meta.json')
  if (!fse.existsSync(file)) {
    fse.ensureDirSync(dir)
    fse.outputJsonSync(file, meta, { spaces: 2 })
  } else {
    meta = await fse.readJson(file)
  }

  ctx.body = meta
}

module.exports = {
  create,
  del,
  fetch,
  find,
}
