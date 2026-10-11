import { loadUploadStorageConfig } from './config.ts'
import { LocalUploadStorage } from './local.ts'
import { S3UploadStorage } from './s3.ts'
import '../config/index.ts'

export const uploadStorageConfig = loadUploadStorageConfig()
/*
 * 业务代码调用 uploadStorage
 *               ↓
 *        按配置选择实现
 *          ↙          ↘
 *    本地磁盘存储     S3 存储
 */
export const uploadStorage = uploadStorageConfig.driver === 's3'
  ? new S3UploadStorage(uploadStorageConfig)
  : new LocalUploadStorage(uploadStorageConfig.directory)
