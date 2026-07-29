import type { AdminFileListQuery, FileListQuery } from '@putongoj/shared'
import type { UserDocument } from '../models/User'
import path from 'node:path'
import fse from 'fs-extra'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'

const uploadDir = path.join(__dirname, '../../public/uploads')

async function getPostgresUserId (username: string) {
  const database = await getDatabase()
  const user = await database.user.findUnique({
    where: { username },
    select: { id: true },
  })
  return user?.id ?? null
}

async function queryFiles (
  where: {
    deletedAt?: null
    ownerId?: number
  },
  options: FileListQuery,
  populateOwner: boolean = false,
) {
  const database = await getDatabase()
  const { page, pageSize, sort, sortBy } = options
  const docsPromise = database.file.findMany({
    where,
    orderBy: { [sortBy]: sort === 1 ? 'asc' : 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: populateOwner
      ? { owner: { select: { username: true } } }
      : undefined,
  })
  const totalPromise = database.file.count({ where })
  const [ docs, total ] = await Promise.all([ docsPromise, totalPromise ])

  return { docs, total }
}

export async function createFileRecord (
  ownerUsername: string,
  data: {
    storageKey: string
    originalName: string
    sizeBytes: number
  },
) {
  const ownerId = await getPostgresUserId(ownerUsername)
  if (ownerId === null) {
    throw new Error(`PostgreSQL user not found: ${ownerUsername}`)
  }
  const database = await getDatabase()
  return await database.file.create({
    data: {
      ...data,
      sizeBytes: BigInt(data.sizeBytes),
      ownerId,
    },
  })
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
    const record = await createFileRecord(profile.uid, {
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

export async function getUsedBytes (ownerUsername: string) {
  const ownerId = await getPostgresUserId(ownerUsername)
  if (ownerId === null) {
    return 0
  }
  const database = await getDatabase()
  const result = await database.file.aggregate({
    where: { ownerId, deletedAt: null },
    _sum: { sizeBytes: true },
  })
  return Number(result._sum.sizeBytes ?? 0)
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

  const usedBytes = await getUsedBytes(profile.uid)
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
    ownerId: (await getPostgresUserId(profile.uid)) ?? -1,
  }

  const [ { docs, total }, usedBytes ] = await Promise.all([
    queryFiles(queryFilter, {
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort,
      sortBy: query.sortBy,
    }, false),
    getUsedBytes(profile.uid),
  ])

  return {
    files: {
      docs: docs.map(doc => ({
        storageKey: doc.storageKey,
        originalName: doc.originalName,
        sizeBytes: Number(doc.sizeBytes),
        createdAt: doc.createdAt,
      })),
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
  let ownerId: number | undefined
  if (query.uploader) {
    const resolvedOwnerId = await getPostgresUserId(query.uploader)
    if (resolvedOwnerId === null) {
      return null
    }
    ownerId = resolvedOwnerId
  }

  const queryFilter: {
    deletedAt: null
    ownerId?: number
  } = {
    deletedAt: null,
  }
  if (ownerId !== undefined) {
    queryFilter.ownerId = ownerId
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
      owner: (doc as typeof doc & { owner?: { username: string } }).owner?.username || 'ghost',
      sizeBytes: Number(doc.sizeBytes),
    })),
    limit: query.pageSize,
    page: query.page,
    pages: Math.ceil(total / query.pageSize),
    total,
  }
}

export async function removeFile (profile: UserDocument, storageKey: string) {
  const database = await getDatabase()
  const file = await database.file.findUnique({ where: { storageKey } })
  if (!file || file.deletedAt) {
    return null
  }
  const profileId = await getPostgresUserId(profile.uid)
  if (!profile.isAdmin && file.ownerId !== profileId) {
    return false
  }

  const saved = await database.file.update({
    where: { storageKey },
    data: {
      deletedAt: new Date(),
      deletedById: profileId,
    },
  })

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
