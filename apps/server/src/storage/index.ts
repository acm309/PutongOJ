import { loadUploadStorageConfig } from './config.ts'
import { LocalUploadStorage } from './local.ts'
import { S3UploadStorage } from './s3.ts'
import '../config/index.ts'

export const uploadStorageConfig = loadUploadStorageConfig()
export const uploadStorage = uploadStorageConfig.driver === 's3'
  ? new S3UploadStorage(uploadStorageConfig)
  : new LocalUploadStorage(uploadStorageConfig.directory)
