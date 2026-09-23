import type { GroupModel } from '@putong-oj/shared'
import { Group, User } from '@putong-oj/db'
import difference from 'lodash/difference.js'

export async function findGroups (): Promise<GroupModel[]> {
  const groups = await Group
    .find({}, 'title createdAt updatedAt')
    .sort({ createdAt: -1, _id: -1 })
    .lean()
  return groups.map(group => ({
    id: group._id.toString(),
    title: group.title,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  }))
}

export async function getGroup (groupId: string) {
  const group = await Group.findById(groupId).lean()
  if (!group) {
    return null
  }

  const users = await User.find({ groups: groupId }, { _id: 0, uid: 1 }).lean()
  return {
    id: group._id.toString(),
    name: group.title,
    members: users.map(u => u.uid),
  }
}

export async function createGroup (name: string) {
  const group = new Group({ title: name })
  await group.save()
  return {
    id: group._id.toString(),
    name: group.title,
    members: [] as string[],
  }
}

export async function updateGroup (groupId: string, name: string) {
  const result = await Group.updateOne({ _id: groupId }, { title: name })
  return result.modifiedCount > 0
}

export async function updateGroupMembers (groupId: string, members: string[]) {
  const group = await getGroup(groupId)
  if (!group) {
    return null
  }

  const toAdd = difference(members, group.members)
  const toRemove = difference(group.members, members)

  const tasks = []
  if (toAdd.length > 0) {
    tasks.push(User.updateMany(
      { uid: { $in: toAdd } },
      { $addToSet: { groups: groupId } },
    ))
  }
  if (toRemove.length > 0) {
    tasks.push(User.updateMany(
      { uid: { $in: toRemove } },
      { $pull: { groups: groupId } },
    ))
  }

  const result = await Promise.all(tasks)
  return result.reduce((sum, res) => sum + res.modifiedCount, 0)
}

export async function removeGroup (groupId: string) {
  const result = await Group.deleteOne({ _id: groupId })
  if (result.deletedCount === 0) {
    return null
  }

  await User.updateMany({ groups: groupId }, { $pull: { groups: groupId } })
  return true
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
