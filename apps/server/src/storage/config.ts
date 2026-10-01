import path from 'node:path'
import process from 'node:process'

const workspaceRoot = path.resolve(import.meta.dirname, '../../../..')

export type UploadStorageConfig = {
  driver: 'local'
  directory: string
} | {
  driver: 's3'
  endpoint: string
  region: string
  bucket: string
  prefix: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

export function loadUploadStorageConfig (env: NodeJS.ProcessEnv = process.env): UploadStorageConfig {
  const driver = env.PTOJ_UPLOAD_STORAGE?.trim() || 'local'
  if (driver === 'local') {
    return {
      driver,
      directory: path.resolve(workspaceRoot, env.PTOJ_UPLOAD_DIR?.trim() || 'apps/server/public/uploads'),
    }
  }
  if (driver !== 's3') {
    throw new Error('PTOJ_UPLOAD_STORAGE must be local or s3')
  }
  const required = (name: string): string => {
    const value = env[name]?.trim()
    if (!value) {
      throw new Error(`${name} is required for S3 upload storage`)
    }
    return value
  }
  const endpoint = required('PTOJ_S3_ENDPOINT')
  if (![ 'http:', 'https:' ].includes(new URL(endpoint).protocol)) {
    throw new Error('PTOJ_S3_ENDPOINT must use HTTP or HTTPS')
  }
  const pathStyle = env.PTOJ_S3_FORCE_PATH_STYLE?.trim() || 'true'
  if (pathStyle !== 'true' && pathStyle !== 'false') {
    throw new Error('PTOJ_S3_FORCE_PATH_STYLE must be true or false')
  }
  return {
    driver,
    endpoint,
    region: env.PTOJ_S3_REGION?.trim() || 'us-east-1',
    bucket: required('PTOJ_S3_BUCKET'),
    prefix: (env.PTOJ_S3_UPLOAD_PREFIX?.trim() || 'uploads').replace(/^\/+|\/+$/g, ''),
    accessKeyId: required('PTOJ_S3_ACCESS_KEY_ID'),
    secretAccessKey: required('PTOJ_S3_SECRET_ACCESS_KEY'),
    forcePathStyle: pathStyle === 'true',
  }
}
