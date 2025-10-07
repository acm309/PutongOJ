import type { GroupModel } from '@putongoj/shared'
import Group from '../models/Group'

export async function findGroups (): Promise<GroupModel[]> {
  const groups = await Group
    .find({}, '-_id gid title createdAt updatedAt')
    .sort({ gid: -1 })
    .lean()
  return groups
}

const groupServices = {
  findGroups,
} as const

export default groupServices
