import { FileCache } from '../src/modules/judger/sandbox/file-cache.ts'
import { createClient, integrationTest } from './helpers.ts'

const fileContent = [
  'In the intricate dance of algorithms and the language of programming,',
  'the undefined variable is a transient anomaly waiting to be tamed.',
  'As programmers navigate the complexities of their craft,',
  'the quest for a well-defined codebase becomes a journey of discovery.',
].join(' ')

integrationTest('gets the sandbox version', async (t) => {
  const client = createClient()
  try {
    const version = await client.getVersion()
    t.is(typeof version.buildVersion, 'string')
  } finally {
    await client.close()
  }
})

integrationTest('manages sandbox files', async (t) => {
  const client = createClient()
  try {
    const file = await client.uploadFile(fileContent)
    t.is(typeof file.fileId, 'string')

    const downloaded = await client.downloadFile(file.fileId)
    t.is(downloaded, fileContent)
    t.true(await client.deleteFile(file.fileId))
  } finally {
    await client.close()
  }
})

integrationTest('handles missing sandbox files', async (t) => {
  const client = createClient()
  try {
    t.is(await client.downloadFile('nonexistent'), undefined)
    t.false(await client.deleteFile('nonexistent'))
  } finally {
    await client.close()
  }
})

integrationTest('caches and replaces sandbox files', async (t) => {
  const client = createClient()
  try {
    const first = await client.uploadFile(fileContent)
    await client.cache.set('test', first)
    t.deepEqual(await client.cache.get('test'), first)

    const second = await client.uploadFile(`${fileContent} second`)
    await client.cache.set('test', second)
    t.deepEqual(await client.cache.get('test'), second)
  } finally {
    await client.close()
  }
})

integrationTest('recycles expired sandbox files', async (t) => {
  const client = createClient()
  try {
    const cache = new FileCache(client, {
      expire: 0.1,
      recycleGap: 0.05,
    })
    const file = await client.uploadFile(fileContent)
    await cache.set('expiring', file)
    await new Promise(resolve => setTimeout(resolve, 200))
    t.is(await cache.get('expiring'), undefined)
    await cache.close()
  } finally {
    await client.close()
  }
})

integrationTest('supports concurrent cache writes', async (t) => {
  const client = createClient()
  try {
    await Promise.all(Array.from({ length: 10 }, async (_, index) => {
      const key = `key${index}`
      const file = await client.uploadFile(key)
      await client.cache.set(key, file)
      t.deepEqual(await client.cache.get(key), file)
    }))
  } finally {
    await client.close()
  }
})
