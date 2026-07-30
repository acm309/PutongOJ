import type { Group } from '@putongoj/db'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'

export async function findGroups (): Promise<Group[]> {
  const database = await getDatabase()
  const groups = await database.group.findMany({
    orderBy: { id: 'desc' },
  })
  return groups.map(group => ({
    id: group.id,
    name: group.name,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  }))
}

export async function getGroup (groupId: number) {
  const database = await getDatabase()
  const group = await database.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
    },
  })
  if (!group) {
    return null
  }

  return {
    id: group.id,
    name: group.name,
    memberIds: group.members.map(member => member.user.id),
  }
}

export async function createGroup (name: string) {
  const database = await getDatabase()
  const group = await database.group.create({ data: { name } })
  return {
    id: group.id,
    name: group.name,
    memberIds: [] as number[],
  }
}

export async function updateGroup (groupId: number, name: string) {
  const database = await getDatabase()
  try {
    await database.group.update({
      where: { id: groupId },
      data: { name },
    })
    return true
  } catch (error) {
    logger.warn(`Failed to update group <Group:${groupId}>: ${String(error)}`)
    return false
  }
}

export async function updateGroupMembers (groupId: number, memberIds: number[]) {
  const database = await getDatabase()
  const uniqueMemberIds = [ ...new Set(memberIds) ]
  const users = await database.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  })
  if (users.length !== uniqueMemberIds.length) {
    return null
  }

  try {
    const result = await database.$transaction(async (transaction) => {
      const existing = await transaction.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
      })
      const existingIds = new Set(existing.map(member => member.userId))
      const nextIds = new Set(users.map(user => user.id))
      const removeIds = [ ...existingIds ].filter(id => !nextIds.has(id))
      const addIds = [ ...nextIds ].filter(id => !existingIds.has(id))

      await transaction.groupMember.deleteMany({
        where: {
          groupId,
          ...(removeIds.length === 0 ? { userId: { in: [] } } : { userId: { in: removeIds } }),
        },
      })
      if (addIds.length > 0) {
        await transaction.groupMember.createMany({
          data: addIds.map(userId => ({ groupId, userId })),
          skipDuplicates: true,
        })
      }
      return addIds.length + removeIds.length
    })
    return result
  } catch (error) {
    logger.warn(`Failed to update members of <Group:${groupId}>: ${String(error)}`)
    return null
  }
}

export async function removeGroup (groupId: number) {
  const database = await getDatabase()
  try {
    await database.group.delete({ where: { id: groupId } })
    return true
  } catch (error) {
    logger.warn(`Failed to remove group <Group:${groupId}>: ${String(error)}`)
    return null
  }
}

const groupService = {
  findGroups,
  getGroup,
  createGroup,
  updateGroup,
  updateGroupMembers,
  removeGroup,
} as const

export default groupService
