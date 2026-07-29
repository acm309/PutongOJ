import type { AdminFileListQuery, FileListQuery, FileModel } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { UserDocument } from '../models/User'
import type { QueryFilter } from '../types/mongo'
import path from 'node:path'
import fse from 'fs-extra'
import Files from '../models/Files'
import logger from '../utils/logger'
import userService from './user'

const uploadDir = path.join(__dirname, '../../public/uploads')

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
  const sizeBytes = Number(file.size || 0)
  const quota = await checkQuota(profile, sizeBytes)
  if (!quota.allowed) {
    return { success: false as const, quota, sizeBytes }
  }

  const filename = path.basename(file.filepath)
  const originalName = String(file.originalFilename || filename)
  const destination = path.join(uploadDir, filename)

  try {
    await fse.move(file.filepath, destination)
    const record = await createFileRecord(profile._id, {
      storageKey: filename,
      originalName,
      sizeBytes,
    })

    return {
      success: true as const,
      record,
      sizeBytes,
      url: `/uploads/${filename}`,
    }
  } catch (err) {
    await fse.remove(destination).catch(() => {})
    throw err
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

  file.deletedAt = new Date()
  file.deletedBy = profile._id
  const saved = await file.save()

  const absolutePath = path.join(uploadDir, saved.storageKey)
  try {
    await fse.remove(absolutePath)
  } catch (err: any) {
    logger.warn(`Failed to remove file on disk for <File:${saved.storageKey}>: ${err.message}`)
  }

  return saved
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
