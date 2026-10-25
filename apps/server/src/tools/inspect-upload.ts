import process from 'node:process'
import { connectMongoose, Files, mongoose } from '@putong-oj/db'
import config from '../config/index.ts'
import { uploadStorage, uploadStorageConfig } from '../storage/index.ts'
import { S3UploadStorage } from '../storage/s3.ts'
import { assertUploadKey } from '../storage/types.ts'

async function main () {
  const key = process.argv[2]
  if (!key || process.argv.length !== 3) {
    console.error('Usage: pnpm --filter @putong-oj/server storage:inspect <storageKey> (build first; use storage:inspect:dev with sources)')
    process.exitCode = 1
    return
  }
  assertUploadKey(key)
  mongoose.set('autoIndex', false)
  mongoose.set('autoCreate', false)
  await connectMongoose({ uri: config.mongodbURL })
  const record = await Files.findOne({ storageKey: key })
    .select('storageKey originalName sizeBytes owner deletedAt deletedBy createdAt updatedAt')
    .lean()
  // 只读核查：缺少记录的历史对象不能直接认定为垃圾。
  const object = await uploadStorage.head(key)
  const state = record?.deletedAt
    ? (object ? 'deleted-record-object-remains' : 'deleted')
    : record
      ? (object ? 'registered' : 'registered-object-missing')
      : (object ? 'unregistered-needs-review' : 'absent')
  console.log(JSON.stringify({
    storageKey: key,
    driver: uploadStorageConfig.driver,
    objectKey: uploadStorageConfig.driver === 's3'
      ? [ uploadStorageConfig.prefix, key ].filter(Boolean).join('/')
      : key,
    state,
    object,
    record,
  }, null, 2))
}

main()
  .catch((err) => {
    console.error(JSON.stringify({ state: 'unknown', error: err instanceof Error ? err.name : 'Error' }))
    process.exitCode = 1
  })
  .finally(async () => {
    if (uploadStorage instanceof S3UploadStorage) {
      uploadStorage.client.destroy()
    }
    await mongoose.disconnect()
  })
