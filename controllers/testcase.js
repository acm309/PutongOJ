const fse = require('fs-extra')
const uuid = require('uuid/v4')
const path = require('path')
const remove = require('lodash.remove')
const send = require('koa-send')

/**
 * 拿到输入输出的测试文件，然后将它移动到专门放测试数据的地方
 * 记得中间要修改对应的 meta.json
 */
const create = async (ctx, next) => {
  const pid = +ctx.params.pid
  // 输入
  const testin = ctx.request.body.files.in.path
  // 输出
  const testout = ctx.request.body.files.out.path
  const testDir = path.resolve(__dirname, `../data/${pid}`)
  const id = uuid()
  const meta = await fse.readJson(path.resolve(testDir, `meta.json`))
  meta.testcases.push({
    uuid: id
  })
  await Promise.all(
    fse.move(testin, path.resolve(testDir, `${id}.in`)),
    fse.move(testout, path.resolve(testDir, `${id}.out`)),
    fse.outputJson(path.resolve(testDir, `meta.json`), meta, { spaces: 2 })
  )
  ctx.body = {
    uuid: id
  }
}

/**
 * 只移除 meta.json 中的对应元素，但并不删除测试数据的文件！
 * 保留测试数据的文件，原因是为了能够继续查看测试样例, 比如 一个提交的测试数据用的是 id 为 1 的测试数据，即时管理员不再用这个数据了，我们仍然能够看到当时这个提交用的测试数据
 */
const del = async (ctx, next) => {
  const pid = +ctx.params.pid
  const uuid = ctx.request.body.uuid
  const testDir = path.resolve(__dirname, `../data/${pid}`)
  const meta = await fse.readJson(path.resolve(testDir, `meta.json`))
  remove(meta.testcases, (item) => item.uuid === uuid)
  await fse.outputJson(path.resolve(testDir, `meta.json`), meta, { spaces: 2 })
  ctx.body = {}
}

/**
 * 这里是将文件返回
 */
const fetch = async (ctx, next) => {
  const pid = ctx.params.pid
  const { uuid, type } = ctx.query // 必须指明要输入文件还是输出文件
  // 原则上需要判断一下请求的文件在不在
  const testDir = path.resolve(__dirname, `../data/${pid}`)
  if (!fse.existsSync(path.resolve(testDir, `${uuid}.${type}`))) {
    ctx.throw(400, 'No such a testcase')
  }
  return send(ctx, `${uuid}.${type}`, { root: testDir })
}

// 返回该题拥有的测试数据
const find = async (ctx, next) => {
  const pid = ctx.params.pid
  const meta = await fse.readJson(
    path.resolve(__dirname, `../data/${pid}/meta.json`)
  )
  ctx.body = {
    testcases: meta
  }
}

module.exports = {
  create,
  del,
  fetch,
  find
}
