import type { StoredFile, StoredFileInfo, UploadStorage } from './types.ts'
import { constants, createReadStream } from 'node:fs'
import { copyFile, mkdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { detectContentType } from './contentType.ts'
import { assertUploadKey } from './types.ts'

export class LocalUploadStorage implements UploadStorage {
  private readonly directory: string

  constructor (directory: string) {
    this.directory = directory
  }

  private filepath (key: string): string {
    assertUploadKey(key)
    return path.join(this.directory, key)
  }

  async putFile (key: string, filepath: string, _contentType?: string): Promise<void> {
    await mkdir(this.directory, { recursive: true })
    await copyFile(filepath, this.filepath(key), constants.COPYFILE_EXCL)
  }

  async head (key: string): Promise<StoredFileInfo | null> {
    const filepath = this.filepath(key)
    try {
      const info = await stat(filepath)
      if (!info.isFile()) {
        return null
      }
      return {
        sizeBytes: info.size,
        contentType: await detectContentType(filepath),
        lastModified: info.mtime,
        etag: `W/"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"`,
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null
      }
      throw err
    }
  }

  async get (key: string): Promise<StoredFile | null> {
    const info = await this.head(key)
    return info ? { ...info, body: createReadStream(this.filepath(key)) } : null
  }

  async remove (key: string): Promise<void> {
    try {
      await unlink(this.filepath(key))
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }
  }
}
