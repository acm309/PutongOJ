import path from 'node:path'
import fse from 'fs-extra'
import { getDatabase } from '../../config/postgres'
import logger from '../../utils/logger'

const uploadDir = path.join(__dirname, '../../../public/uploads')

export default async function scanUploadsFolder () {
  const database = await getDatabase()
  const admin = await database.user.findUnique({ where: { username: 'admin' }, select: { id: true } })
  if (!admin) { throw new Error('admin user not found') }
  if (!await fse.pathExists(uploadDir)) { return }

  const entries = await fse.readdir(uploadDir)
  const existing = await database.file.findMany({
    where: { storageKey: { in: entries } },
    select: { storageKey: true },
  })
  const known = new Set(existing.map(file => file.storageKey))
  const data: Array<{ storageKey: string, originalName: string, sizeBytes: number, ownerId: number }> = []
  for (const name of entries) {
    const stat = await fse.stat(path.join(uploadDir, name))
    if (stat.isFile() && !known.has(name)) {
      data.push({ storageKey: name, originalName: name, sizeBytes: stat.size, ownerId: admin.id })
    }
  }

  if (data.length) { await database.file.createMany({ data, skipDuplicates: true }) }
  logger.info(`Scan uploads folder finished: added=${data.length}`)
}
