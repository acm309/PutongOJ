import type { Readable } from 'node:stream'

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
  const hasControlCharacter = Array.from(key).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  if (!key || key === '.' || key === '..' || /[/\\]/.test(key) || hasControlCharacter) {
    throw new Error('Invalid upload storage key')
  }
}
