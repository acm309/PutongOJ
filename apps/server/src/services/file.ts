import type { AdminFileListQuery, FileListQuery } from '@putongoj/shared'
import type { AuthenticatedUser } from '../persistence/types'
import path from 'node:path'
import fse from 'fs-extra'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'

const uploadDir = path.join(__dirname, '../../public/uploads')

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
    orderBy: { [sortBy]: sort },
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
  ownerId: number,
  data: {
    storageKey: string
    originalName: string
    sizeBytes: number
  },
) {
  const database = await getDatabase()
  return await database.file.create({
    data: {
      ...data,
      sizeBytes: data.sizeBytes,
      ownerId,
    },
  })
}

export async function uploadFile (
  profile: AuthenticatedUser,
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
    const record = await createFileRecord(profile.id, {
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

export async function getUsedBytes (ownerId: number) {
  const database = await getDatabase()
  const result = await database.file.aggregate({
    where: { ownerId, deletedAt: null },
    _sum: { sizeBytes: true },
  })
  return Number(result._sum.sizeBytes ?? 0)
}

export async function checkQuota (
  profile: AuthenticatedUser,
  incomingSizeBytes: number,
): Promise<{ allowed: boolean, usedBytes: number, storageQuota: number }> {
  if (profile.isAdmin) {
    return {
      allowed: true,
      usedBytes: 0,
      storageQuota: Number(profile.storageQuota),
    }
  }

  const usedBytes = await getUsedBytes(profile.id)
  const storageQuota = Number(profile.storageQuota)
  const allowed = usedBytes + incomingSizeBytes <= storageQuota

  return {
    allowed,
    usedBytes,
    storageQuota,
  }
}

export async function findFiles (
  profile: AuthenticatedUser,
  query: FileListQuery,
) {
  const queryFilter: Record<string, any> = {
    deletedAt: null,
    ownerId: profile.id,
  }

  const [ { docs, total }, usedBytes ] = await Promise.all([
    queryFiles(queryFilter, {
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort,
      sortBy: query.sortBy,
    }, false),
    getUsedBytes(profile.id),
  ])

  return {
    files: {
      items: docs.map(doc => ({
        storageKey: doc.storageKey,
        originalName: doc.originalName,
        sizeBytes: Number(doc.sizeBytes),
        createdAt: doc.createdAt,
      })),
      page: query.page,
      pageSize: query.pageSize,
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
  if (query.ownerId) {
    const database = await getDatabase()
    const user = await database.user.findFirst({
      where: { id: query.ownerId },
      select: { id: true },
    })
    if (!user) { return null }
    ownerId = user.id
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
    items: docs.map(doc => ({
      ownerId: doc.ownerId,
      storageKey: doc.storageKey,
      originalName: doc.originalName,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt,
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
  }
}

export async function removeFile (profile: AuthenticatedUser, storageKey: string) {
  const database = await getDatabase()
  const file = await database.file.findUnique({ where: { storageKey } })
  if (!file || file.deletedAt) {
    return null
  }
  const profileId = profile.id
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
