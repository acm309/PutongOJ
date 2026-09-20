import type { FileModel } from '@putong-oj/shared'
import path from 'node:path'
import { Files, User } from '@putong-oj/db'
import fse from 'fs-extra'
import { createLogger } from '../logger.ts'

const logger = createLogger('worker.scan-uploads')

async function scanUploadsFolder (uploadDir: string) {
  const stats = {
    scanned: 0,
    added: 0,
    skipped: 0,
    failed: 0,
  }

  const admin = await User.findOne({ uid: 'admin' })
  if (!admin) {
    throw new Error('admin user not found')
  }

  const exists = await fse.pathExists(uploadDir)
  if (!exists) {
    logger.info('Upload directory does not exist, nothing to scan')
    return
  }

  const entries = await fse.readdir(uploadDir)
  const existingStorageKeys = new Set<string>()
  if (entries.length > 0) {
    const existingFiles = await Files.find(
      { storageKey: { $in: entries } },
      { storageKey: 1, _id: 0 },
    ).lean()

    for (const file of existingFiles) {
      existingStorageKeys.add(file.storageKey)
    }
  }

  const pendingInsertDocs: Array<Pick<FileModel, 'owner' | 'storageKey' | 'originalName' | 'sizeBytes'>> = []
  for (const name of entries) {
    stats.scanned++
    const absolutePath = path.join(uploadDir, name)

    try {
      const stat = await fse.stat(absolutePath)
      if (!stat.isFile()) {
        stats.skipped++
        continue
      }

      if (existingStorageKeys.has(name)) {
        stats.skipped++
        continue
      }

      pendingInsertDocs.push({
        owner: admin._id,
        storageKey: name,
        originalName: name,
        sizeBytes: stat.size,
      })

      existingStorageKeys.add(name)
    } catch (err) {
      stats.failed++
      logger.error({ err, name }, 'Failed scanning upload')
    }
  }

  if (pendingInsertDocs.length > 0) {
    try {
      await Files.insertMany(pendingInsertDocs, { ordered: false })
      stats.added += pendingInsertDocs.length
    } catch (err: any) {
      const writeErrors = Array.isArray(err?.writeErrors) ? err.writeErrors : []
      if (writeErrors.length === 0) {
        throw err
      }

      const insertedCount = Math.max(0, pendingInsertDocs.length - writeErrors.length)
      stats.added += insertedCount

      for (const writeError of writeErrors) {
        if (writeError?.code === 11000) {
          // Duplicate keys may happen in race conditions with concurrent scans.
          stats.skipped++
        } else {
          stats.failed++
        }
      }

      logger.error({ err }, 'Scan uploads folder insertMany encountered partial failures')
    }
  }

  logger.info(stats, 'Scan uploads folder finished')
}

export default scanUploadsFolder
