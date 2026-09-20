import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  AdminGroupCreatePayloadSchema,
  AdminGroupDetailQueryResultSchema,
  AdminGroupMembersUpdatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import { loadProfile, rootRequire } from '../../middlewares/authn.ts'
import groupService from '../../services/group.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

function parseGroupId (ctx: Context): number | null {
  const groupIdStr = ctx.params.groupId
  const groupId = Number(groupIdStr)

  if (Number.isNaN(groupId) || !Number.isInteger(groupId) || groupId < 0) {
    createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid group ID')
    return null
  }
  return groupId
}

export async function getGroup (ctx: Context) {
  const groupId = parseGroupId(ctx)
  if (groupId === null) {
    return
  }

  const group = await groupService.getGroup(groupId)
  if (!group) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const result = AdminGroupDetailQueryResultSchema.encode(group)
  return createEnvelopedResponse(ctx, result)
}

export async function createGroup (ctx: Context) {
  const payload = AdminGroupCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const group = await groupService.createGroup(payload.data.name)
    const result = AdminGroupDetailQueryResultSchema.encode(group)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Group:${group.groupId}> created by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, result)
  } catch (err) {
    ctx.auditLog.error('Failed to create group', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateGroup (ctx: Context) {
  const groupId = parseGroupId(ctx)
  if (groupId === null) {
    return
  }

  const payload = AdminGroupCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const success = await groupService.updateGroup(groupId, payload.data.name)
    if (!success) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Group:${groupId}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update group', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateGroupMembers (ctx: Context) {
  const groupId = parseGroupId(ctx)
  if (groupId === null) {
    return
  }

  const payload = AdminGroupMembersUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const modifiedCount = await groupService.updateGroupMembers(groupId, payload.data.members)
    if (modifiedCount === null) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Group:${groupId}> updated ${modifiedCount} members by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, { modifiedCount })
  } catch (err) {
    ctx.auditLog.error('Failed to update group members', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function removeGroup (ctx: Context) {
  const groupId = parseGroupId(ctx)
  if (groupId === null) {
    return
  }

  try {
    const result = await groupService.removeGroup(groupId)
    if (result === null) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Group:${groupId}> removed by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to remove group', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function registerAdminGroupHandlers (router: Router) {
  router.get('/groups/:groupId', getGroup)
  router.post('/groups', createGroup)
  router.put('/groups/:groupId', updateGroup)
  router.put('/groups/:groupId/members', updateGroupMembers)
  router.delete('/groups/:groupId', rootRequire, removeGroup)
}

export default registerAdminGroupHandlers
