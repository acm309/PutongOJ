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
  connectionTimeoutMs: number
  uploadTimeoutMs: number
  readTimeoutMs: number
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
  const timeout = (name: string, fallback: number): number => {
    const value = env[name]?.trim()
    if (!value) {
      return fallback
    }
    const parsed = Number(value)
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1 || parsed > 2_147_483_647) {
      throw new Error(`${name} must be a positive integer up to 2147483647 milliseconds`)
    }
    return parsed
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
    connectionTimeoutMs: timeout('PTOJ_S3_CONNECTION_TIMEOUT_MS', 3000),
    uploadTimeoutMs: timeout('PTOJ_S3_UPLOAD_TIMEOUT_MS', 10000),
    readTimeoutMs: timeout('PTOJ_S3_READ_TIMEOUT_MS', 5000),
  }
}
