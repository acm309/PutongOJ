import type { Readable } from 'node:stream'

export class UploadTimeoutError extends Error {
  override name = 'UploadTimeoutError'

  constructor () {
    super('Image upload timed out. Please try uploading again.')
  }
}

export interface StoredFileInfo {
  sizeBytes: number
  contentType: string
  lastModified?: Date
  etag?: string
}

export interface StoredFile extends StoredFileInfo {
  body: Readable
}

export interface UploadStorage {
  putFile: (key: string, filepath: string, contentType: string) => Promise<void>
  get: (key: string) => Promise<StoredFile | null>
  head: (key: string) => Promise<StoredFileInfo | null>
  remove: (key: string) => Promise<void>
}

export function assertUploadKey (key: string): void {
  // 拒绝编码小于 32 的控制字符（如制表符、换行、回车）及编码为 127 的删除字符。
  const hasControlCharacter = Array.from(key).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  if (!key || key === '.' || key === '..' || /[/\\]/.test(key) || hasControlCharacter) {
    throw new Error('Invalid upload storage key')
  }
}
