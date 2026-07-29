import type { GroupModel } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'

export async function findGroups (): Promise<GroupModel[]> {
  const database = await getDatabase()
  const groups = await database.group.findMany({
    orderBy: { id: 'desc' },
  })
  return groups.map(group => ({
    gid: group.id,
    title: group.name,
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
            select: { username: true },
          },
        },
      },
    },
  })
  if (!group) {
    return null
  }

  return {
    groupId: group.id,
    name: group.name,
    members: group.members.map(member => member.user.username),
  }
}

export async function createGroup (name: string) {
  const database = await getDatabase()
  const group = await database.group.create({ data: { name } })
  return {
    groupId: group.id,
    name: group.name,
    members: [] as string[],
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
  } catch {
    return false
  }
}

export async function updateGroupMembers (groupId: number, members: string[]) {
  const database = await getDatabase()
  const uniqueMembers = [ ...new Set(members) ]
  const users = await database.user.findMany({
    where: { username: { in: uniqueMembers } },
    select: { id: true, username: true },
  })
  if (users.length !== uniqueMembers.length) {
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
  } catch {
    return null
  }
}

export async function removeGroup (groupId: number) {
  const database = await getDatabase()
  try {
    await database.group.delete({ where: { id: groupId } })
    return true
  } catch {
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
