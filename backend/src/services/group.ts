import type { GroupModel } from '@putongoj/shared'
import { difference } from 'lodash'
import Group from '../models/Group'
import User from '../models/User'

export async function findGroups (): Promise<GroupModel[]> {
  const groups = await Group
    .find({}, '-_id gid title createdAt updatedAt')
    .sort({ gid: -1 })
    .lean()
  return groups
}

export async function getGroup (groupId: number) {
  const group = await Group.findOne({ gid: groupId }).lean()
  if (!group) {
    return null
  }

  const users = await User.find({ gid: groupId }, { _id: 0, uid: 1 }).lean()
  return {
    groupId: group.gid,
    name: group.title,
    members: users.map(u => u.uid),
  }
}

export async function createGroup (name: string) {
  const group = new Group({ title: name })
  await group.save()
  return {
    groupId: group.gid,
    name: group.title,
    members: [] as string[],
  }
}

export async function updateGroup (groupId: number, name: string) {
  const result = await Group.updateOne({ gid: groupId }, { title: name })
  return result.modifiedCount > 0
}

export async function updateGroupMembers (groupId: number, members: string[]) {
  const group = await getGroup(groupId)
  if (!group) {
    return null
  }

  const toAdd = difference(members, group.members)
  const toRemove = difference(group.members, members)

  const result = await Promise.all([
    User.updateMany({ uid: { $in: toAdd } }, { $addToSet: { gid: groupId } }),
    User.updateMany({ uid: { $in: toRemove } }, { $pullAll: { gid: groupId } }),
  ])

  return result[0].modifiedCount + result[1].modifiedCount
}

export async function removeGroup (groupId: number) {
  const result = await Group.deleteOne({ gid: groupId })
  if (result.deletedCount === 0) {
    return null
  }

  await User.updateMany({ gid: groupId }, { $pullAll: { gid: groupId } })
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
