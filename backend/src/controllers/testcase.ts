import type { Context } from 'koa'
import path from 'node:path'
import { ProblemTestcaseListQueryResultSchema } from '@putongoj/shared'
import fse from 'fs-extra'
import send from 'koa-send'
import remove from 'lodash/remove'
import { v4 as uuid, validate } from 'uuid'
import { loadProfile } from '../middlewares/authn'
import courseService from '../services/course'
import { createEnvelopedResponse } from '../utils'
import { ERR_INVALID_ID, ERR_PERM_DENIED } from '../utils/error'
import logger from '../utils/logger'
import { loadProblem } from './problem'

export async function findTestcases (ctx: Context) {
  const problem = await loadProblem(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner === profile.id))) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  let meta = { testcases: [] }
  const dir = path.resolve(__dirname, `../../data/${pid}`)
  const file = path.resolve(dir, 'meta.json')
  if (!fse.existsSync(file)) {
    fse.ensureDirSync(dir)
    fse.outputJsonSync(file, meta, { spaces: 2 })
  } else {
    meta = await fse.readJson(file)
  }

  const result = ProblemTestcaseListQueryResultSchema.parse(meta.testcases)
  return createEnvelopedResponse(ctx, result)
}

export async function createTestcase (ctx: Context) {
  const problem = await loadProblem(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner === profile.id))) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  const { uid } = profile

  const testin = ctx.request.body.in || ''
  const testout = ctx.request.body.out || ''

  if (!testin && !testout) {
    ctx.throw(400, 'Cannot create testcase without both input and output')
  }

  /**
   * 拿到输入输出的测试文件，然后将它移动到专门放测试数据的地方
   * 记得中间要修改对应的 meta.json
   */

  const testDir = path.resolve(__dirname, `../../data/${pid}`)
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
  logger.info(`Testcase <${id}> for problem <${pid}> is created by user <${uid}>`)

  const result = ProblemTestcaseListQueryResultSchema.parse(meta.testcases)
  return createEnvelopedResponse(ctx, result)
}

export async function removeTestcase (ctx: Context) {
  const problem = await loadProblem(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner === profile.id))) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  const { uid } = profile
  const uuid = String(ctx.params.uuid || '').trim()
  if (!validate(uuid) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
    ctx.throw(...ERR_INVALID_ID)
  }

  /**
   * 只移除 meta.json 中的对应元素，但并不删除测试数据的文件！
   * 保留测试数据的文件，原因是为了能够继续查看测试样例, 比如：
   * 一个提交的测试数据用的是 id 为 1 的测试数据，即时管理员不再用这个数据了，我们仍然能够看到当时这个提交用的测试数据
   */

  const testDir = path.resolve(__dirname, `../../data/${pid}`)
  const meta = await fse.readJson(path.resolve(testDir, 'meta.json'))

  remove(meta.testcases, item => item.uuid === uuid)
  await fse.outputJson(path.resolve(testDir, 'meta.json'), meta, { spaces: 2 })
  logger.info(`Testcase <${uuid}> for problem <${pid}> is deleted by user <${uid}>`)

  const result = ProblemTestcaseListQueryResultSchema.parse(meta.testcases)
  return createEnvelopedResponse(ctx, result)
}

export async function getTestcase (ctx: Context) {
  const problem = await loadProblem(ctx)
  const profile = await loadProfile(ctx)
  if (!(
    profile.isAdmin
    || (problem.owner && problem.owner === profile.id)
    || courseService.hasProblemRole(
      profile.id, problem.id, 'viewTestcase',
    )
  )) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  const uuid = String(ctx.params.uuid || '').trim()
  if (!validate(uuid) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
    ctx.throw(...ERR_INVALID_ID)
  }
  const type = ctx.params.type
  if (type !== 'in' && type !== 'out') {
    ctx.throw(400, 'Invalid type')
  }

  const testDir = path.resolve(__dirname, `../../data/${pid}`)
  if (!fse.existsSync(path.resolve(testDir, `${uuid}.${type}`))) {
    ctx.throw(400, 'No such a testcase')
  }
  ctx.type = 'text/plain; charset=utf-8'
  await send(ctx, `${uuid}.${type}`, { root: testDir })
}

const testcaseController = {
  findTestcases,
  createTestcase,
  getTestcase,
  removeTestcase,
} as const

export default testcaseController
