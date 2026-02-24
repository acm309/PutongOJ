import type { Context } from 'koa'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { ProblemTestcaseListQueryResultSchema } from '@putongoj/shared'
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js'
import fse from 'fs-extra'
import send from 'koa-send'
import remove from 'lodash/remove'
import { v4 as uuid, validate } from 'uuid'
import { loadProfile } from '../middlewares/authn'
import { loadProblemOrThrow } from '../policies/problem'
import courseService from '../services/course'
import { createEnvelopedResponse } from '../utils'
import { ERR_INVALID_ID, ERR_PERM_DENIED } from '../utils/constants'

export async function findTestcases (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner.equals(profile._id)))) {
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

export async function exportTestcases (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  if (!(
    profile.isAdmin
    || (problem.owner && problem.owner.equals(profile._id))
    || courseService.hasProblemRole(
      profile._id, problem._id, 'viewTestcase',
    )
  )) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  const testDir = path.resolve(__dirname, `../../data/${pid}`)

  if (!fse.existsSync(testDir)) {
    ctx.throw(404, 'No testcases found for this problem')
  }

  const metaFile = path.resolve(testDir, 'meta.json')
  if (!fse.existsSync(metaFile)) {
    ctx.throw(404, 'No testcases found for this problem')
  }

  const meta = await fse.readJson(metaFile)
  const testcases = meta.testcases || []

  if (testcases.length === 0) {
    ctx.throw(404, 'No testcases found for this problem')
  }

  try {
    const zipWriter = new ZipWriter(new BlobWriter('application/zip'))

    for (const testcase of testcases) {
      const { uuid } = testcase

      const inFile = path.resolve(testDir, `${uuid}.in`)
      if (fse.existsSync(inFile)) {
        const inContent = await fse.readFile(inFile, 'utf8')
        await zipWriter.add(`${uuid}.in`, new TextReader(inContent))
      }

      const outFile = path.resolve(testDir, `${uuid}.out`)
      if (fse.existsSync(outFile)) {
        const outContent = await fse.readFile(outFile, 'utf8')
        await zipWriter.add(`${uuid}.out`, new TextReader(outContent))
      }
    }

    const zipBlob = await zipWriter.close()
    const filename = `PutongOJ-testcases-problem-${pid}-${Date.now()}.zip`

    ctx.set('Content-Type', 'application/zip')
    ctx.set('Content-Disposition', `attachment; filename="${filename}"`)
    ctx.set('Cache-Control', 'no-cache')

    ctx.body = Buffer.from(await zipBlob.arrayBuffer())
    ctx.auditLog.info(`Testcases for <Problem:${pid}> exported by user <User:${profile.uid}>`)
  } catch (error) {
    ctx.auditLog.error(`Failed to export testcases for <Problem:${pid}>:`, error)
    ctx.throw(500, 'Failed to export testcases')
  }
}

export async function createTestcase (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner.equals(profile._id)))) {
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
  ctx.auditLog.info(`<Testcase:${id}> for <Problem:${pid}> created by <User:${uid}>`)

  const result = ProblemTestcaseListQueryResultSchema.parse(meta.testcases)
  return createEnvelopedResponse(ctx, result)
}

export async function removeTestcase (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  if (!(profile.isAdmin || (problem.owner && problem.owner.equals(profile._id)))) {
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
  ctx.auditLog.info(`<Testcase:${uuid}> for <Problem:${pid}> removed by <User:${uid}>`)

  const result = ProblemTestcaseListQueryResultSchema.parse(meta.testcases)
  return createEnvelopedResponse(ctx, result)
}

export async function getTestcase (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  if (!(
    profile.isAdmin
    || (problem.owner && problem.owner.equals(profile._id))
    || courseService.hasProblemRole(
      profile._id, problem._id, 'viewTestcase',
    )
  )) {
    ctx.throw(...ERR_PERM_DENIED)
  }

  const { pid } = problem
  const uuid = String(ctx.params.uuid || '').trim()
  if (!validate(uuid) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) {
    ctx.throw(...ERR_INVALID_ID)
  }
  const type = String(ctx.params.type || '').trim()
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
  exportTestcases,
  createTestcase,
  getTestcase,
  removeTestcase,
} as const

export default testcaseController
