import type { Types, UserDocument } from '@putong-oj/db'
import type { AdminFileListQuery, FileListQuery, FileModel } from '@putong-oj/shared'
import type { QueryFilter } from '../types/mongo.ts'
import path from 'node:path'
import { Files, mongoose } from '@putong-oj/db'
import fse from 'fs-extra'
import { detectContentType } from '../storage/contentType.ts'
import { uploadStorage } from '../storage/index.ts'
import { createLogger } from '../utils/logger.ts'
import userService from './user.ts'

const logger = createLogger('server.file')

async function queryFiles (
  filter: QueryFilter<FileModel>,
  options: FileListQuery,
  populateOwner: boolean = false,
) {
  const { page, pageSize, sort, sortBy } = options
  let query = Files.find(filter)
    .sort({ [sortBy]: sort })
    .skip((page - 1) * pageSize)
    .limit(pageSize)

  if (populateOwner) {
    query = query.populate({ path: 'owner', select: 'uid' })
  }

  const docsPromise = query.lean()
  const totalPromise = Files.countDocuments(filter)
  const [ docs, total ] = await Promise.all([ docsPromise, totalPromise ])

  return { docs, total }
}

export async function createFileRecord (
  owner: Types.ObjectId,
  data: {
    storageKey: string
    originalName: string
    sizeBytes: number
  },
) {
  const record = new Files({ ...data, owner })
  return await record.save()
}

export async function uploadFile (
  profile: UserDocument,
  file: {
    filepath: string
    originalFilename?: string | null
    size?: number
  },
) {
  const filename = path.basename(file.filepath)
  const originalName = String(file.originalFilename || filename)
  try {
    const sizeBytes = (await fse.stat(file.filepath)).size
    const quota = await checkQuota(profile, sizeBytes)
    if (!quota.allowed) {
      return { success: false as const, quota, sizeBytes }
    }
    const contentType = await detectContentType(file.filepath)
    try {
      await uploadStorage.putFile(filename, file.filepath, contentType)
    } catch (err) {
      // A lost PUT response can leave bytes behind without a database row.
      // Preserve them until reconciliation; never delete a possibly existing key.
      logger.warn({ storageKey: filename }, 'Storage upload did not return success; check object during reconciliation')
      throw err
    }
    let record
    try {
      record = await createFileRecord(profile._id, {
        storageKey: filename,
        originalName,
        sizeBytes,
      })
    } catch (err: any) {
      // A network timeout may occur after MongoDB committed. Preserve the object
      // unless registration was definitely rejected and no row references this key.
      const rejected = err instanceof mongoose.Error.ValidationError || [ 11000, 121 ].includes(err.code)
      if (rejected) {
        try {
          if (!await Files.exists({ storageKey: filename })) {
            await uploadStorage.remove(filename)
          }
        } catch (cleanupError) {
          logger.warn({ err: cleanupError, storageKey: filename }, 'Upload requires storage reconciliation')
        }
      } else {
        logger.warn({ storageKey: filename }, 'Upload registration outcome unknown; object retained for reconciliation')
      }
      throw err
    }

    return {
      success: true as const,
      record,
      sizeBytes,
      url: `/uploads/${filename}`,
    }
  } finally {
    await fse.remove(file.filepath).catch((err) => {
      logger.warn({ err }, 'Failed to clean up temporary upload')
    })
  }
}

export async function getUsedBytes (owner: Types.ObjectId) {
  const result = await Files.aggregate<{ total: number }>([
    { $match: { owner, deletedAt: null } },
    { $group: { _id: null, total: { $sum: '$sizeBytes' } } },
  ])
  return result[0]?.total || 0
}

export async function checkQuota (
  profile: UserDocument,
  incomingSizeBytes: number,
): Promise<{ allowed: boolean, usedBytes: number, storageQuota: number }> {
  if (profile.isAdmin) {
    return {
      allowed: true,
      usedBytes: 0,
      storageQuota: profile.storageQuota,
    }
  }

  const usedBytes = await getUsedBytes(profile._id)
  const storageQuota = profile.storageQuota
  const allowed = usedBytes + incomingSizeBytes <= storageQuota

  return {
    allowed,
    usedBytes,
    storageQuota,
  }
}

export async function findFiles (
  profile: UserDocument,
  query: FileListQuery,
) {
  const queryFilter: Record<string, any> = {
    deletedAt: null,
    owner: profile._id,
  }

  const [ { docs, total }, usedBytes ] = await Promise.all([
    queryFiles(queryFilter, {
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort,
      sortBy: query.sortBy,
    }, false),
    getUsedBytes(profile._id),
  ])

  return {
    files: {
      docs,
      limit: query.pageSize,
      page: query.page,
      pages: Math.ceil(total / query.pageSize),
      total,
    },
    usage: {
      usedBytes,
      storageQuota: profile.storageQuota,
    },
  }
}

export async function findAdminFiles (query: AdminFileListQuery) {
  let ownerFilter: Types.ObjectId | undefined
  if (query.uploader) {
    const owner = await userService.getUser(query.uploader)
    if (!owner) {
      return null
    }
    ownerFilter = owner._id
  }

  const queryFilter: Record<string, any> = {
    deletedAt: null,
  }
  if (ownerFilter) {
    queryFilter.owner = ownerFilter
  }

  const { docs, total } = await queryFiles(queryFilter, {
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
    sortBy: query.sortBy,
  }, true)

  return {
    docs: docs.map(doc => ({
      ...doc,
      owner: (doc.owner as any)?.uid || 'ghost',
    })),
    limit: query.pageSize,
    page: query.page,
    pages: Math.ceil(total / query.pageSize),
    total,
  }
}

export async function removeFile (profile: UserDocument, storageKey: string) {
  const file = await Files.findOne({ storageKey })
  if (!file || file.deletedAt) {
    return null
  }
  if (!profile.isAdmin && !file.owner.equals(profile._id)) {
    return false
  }

  // If physical deletion fails, keep the row active so the caller can retry.
  // Removal is idempotent if saving the tombstone fails after deleting the object.
  await uploadStorage.remove(file.storageKey)
  file.deletedAt = new Date()
  file.deletedBy = profile._id
  return await file.save()
}

const fileService = {
  createFileRecord,
  uploadFile,
  getUsedBytes,
  checkQuota,
  findFiles,
  findAdminFiles,
  removeFile,
} as const

export default fileService
