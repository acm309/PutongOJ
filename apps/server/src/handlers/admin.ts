import type { AdminAccountBatchRegisterResult } from '@putongoj/shared'
import type { Context } from 'koa'
import type { DiscussionUpdateDto } from '../services/discussion'
import Router from '@koa/router'
import {
  AdminAccountBatchRegisterPayloadSchema,
  AdminAccountBatchRegisterResultSchema,
  AdminCommentUpdatePayloadSchema,
  AdminDiscussionUpdatePayloadSchema,
  AdminFileListQueryResultSchema,
  AdminFileListQuerySchema,
  AdminGroupCreatePayloadSchema,
  AdminGroupDetailQueryResultSchema,
  AdminGroupMembersUpdatePayloadSchema,
  AdminNotificationCreatePayloadSchema,
  AdminPostCreatePayloadSchema,
  AdminPostDetailQueryResultSchema,
  AdminPostListQueryResultSchema,
  AdminPostListQuerySchema,
  AdminPostUpdatePayloadSchema,
  AdminSolutionListExportQueryResultSchema,
  AdminSolutionListExportQuerySchema,
  AdminSolutionListQueryResultSchema,
  AdminSolutionListQuerySchema,
  AdminTagCreatePayloadSchema,
  AdminTagListQueryResultSchema,
  AdminTagUpdatePayloadSchema,
  AdminUserChangePasswordPayloadSchema,
  AdminUserDetailQueryResultSchema,
  AdminUserEditPayloadSchema,
  AdminUserListQueryResultSchema,
  AdminUserListQuerySchema,
  AdminUserOAuthQueryResultSchema,
  AvatarPresetsEditPayloadSchema,
  ErrorCode,
  SessionListQueryResultSchema,
  SessionRevokeOthersResultSchema,
  UserPrivilege,
} from '@putongoj/shared'
import { distributeWork } from '../jobs/helper'
import { adminRequire, loadProfile, rootRequire } from '../middlewares/authn'
import { dataExportLimit } from '../middlewares/ratelimit'
import { loadPost } from '../policies/post'
import { contestService } from '../services/contest'
import cryptoService from '../services/crypto'
import discussionService from '../services/discussion'
import fileService from '../services/file'
import groupService from '../services/group'
import oauthService from '../services/oauth'
import { postService } from '../services/post'
import problemService from '../services/problem'
import sessionService from '../services/session'
import { settingsService } from '../services/settings'
import solutionService from '../services/solution'
import tagService from '../services/tag'
import userService from '../services/user'
import websocketService from '../services/websocket'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isComplexPwd,
  passwordHash,
} from '../utils'
import { providerMap } from './oauth'
import { loadUser } from './user'

async function loadEditingUser (ctx: Context) {
  const user = await loadUser(ctx)
  const profile = await loadProfile(ctx)
  const privilegeRank: Record<UserPrivilege, number> = {
    [UserPrivilege.BANNED]: 0,
    [UserPrivilege.USER]: 1,
    [UserPrivilege.ADMIN]: 2,
    [UserPrivilege.ROOT]: 3,
  }
  const profilePrivilege = profile.privilege as UserPrivilege
  const userPrivilege = user.privilege as UserPrivilege
  if (!profile.isRoot && privilegeRank[profilePrivilege] <= privilegeRank[userPrivilege] && profile.id !== user.id) {
    createErrorResponse(ctx, ErrorCode.Forbidden, 'Insufficient privilege to edit this user')
    return null
  }
  return user
}

export async function findUsers (ctx: Context) {
  const query = AdminUserListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userService.findUsers(query.data)
  const result = AdminUserListQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

export async function getUser (ctx: Context) {
  const user = await loadUser(ctx)
  const result = AdminUserDetailQueryResultSchema.encode(user)
  return createEnvelopedResponse(ctx, result)
}

export async function updateUser (ctx: Context) {
  const payload = AdminUserEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  if (payload.data.privilege !== undefined) {
    if (profile.id === user.id) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Cannot change your own privilege')
    }
    if (!profile.isRoot && (
      payload.data.privilege === UserPrivilege.ADMIN
      || payload.data.privilege === UserPrivilege.ROOT
    )) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Cannot elevate user privilege to equal or higher than yourself')
    }
  }
  if (payload.data.avatarUrl !== undefined && !profile.isRoot) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Only root administrators can change user avatars')
  }

  try {
    const { privilege, nickname, avatarUrl, motto, school, email, storageQuota } = payload.data
    const updatedUser = await userService.updateUser(user.id, {
      privilege, nickname, avatarUrl, motto, school, email, storageQuota,
    })
    const result = AdminUserDetailQueryResultSchema.encode(updatedUser)
    ctx.auditLog.info(`<User:${user.username}> updated by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, result)
  } catch (err) {
    ctx.auditLog.error('Failed to update user', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateUserPassword (ctx: Context) {
  const payload = AdminUserChangePasswordPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let password: string | undefined
  try {
    password = await cryptoService.decryptData(payload.data.newPassword)
  } catch {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Failed to decrypt password field')
  }
  if (!isComplexPwd(password)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Password is not complex enough')
  }
  const pwd = passwordHash(password)

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  try {
    await userService.updateUser(user.id, { passwordHash: pwd })
    const revoked = await sessionService.revokeOtherSessions(String(user.id), '')
    ctx.auditLog.info(`<User:${user.username}> password reset by <User:${profile.username}>, revoked ${revoked} session(s)`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update user password', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function batchRegisterUsers (ctx: Context) {
  const payload = AdminAccountBatchRegisterPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const users = payload.data

  const results: AdminAccountBatchRegisterResult['results'] = []
  let created = 0

  for (const item of users) {
    const username = item.username
    const password = item.password

    if (!isComplexPwd(password)) {
      results.push({
        username,
        success: false,
        message: 'Password is not complex enough',
      })
      continue
    }

    const available = await userService.checkUserAvailable(username)
    if (!available) {
      results.push({
        username,
        success: false,
        message: 'The username has been registered or reserved',
      })
      continue
    }

    try {
      await userService.createUser({
        username,
        passwordHash: passwordHash(password),
        nickname: item.nickname,
      })
      created += 1
      results.push({
        username,
        success: true,
      })
    } catch (err) {
      ctx.auditLog.error(`Failed to batch register <User:${username}>`, err)
      results.push({
        username,
        success: false,
        message: 'Failed to create user',
      })
    }
  }

  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`Batch register completed by <User:${profile.username}>, created ${created}/${users.length} users`)

  const result = AdminAccountBatchRegisterResultSchema.parse({
    total: users.length,
    created,
    failed: users.length - created,
    results,
  })
  return createEnvelopedResponse(ctx, result)
}

export async function getUserOAuthConnections (ctx: Context) {
  const user = await loadUser(ctx)
  const connections = await oauthService.getUserOAuthConnections(user.id)
  const result = AdminUserOAuthQueryResultSchema.encode(connections)
  return createEnvelopedResponse(ctx, result)
}

export async function removeUserOAuthConnection (ctx: Context) {
  const providerName = ctx.params.provider
  if (typeof providerName !== 'string' || !(providerName in providerMap)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'No such OAuth provider')
  }
  const provider = providerMap[providerName as keyof typeof providerMap]

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const result = await oauthService.removeOAuthConnection(user.id, provider)
  if (!result) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  } else {
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<User:${user.username}> removed ${provider} OAuth connection by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  }
}

export async function findSolutions (ctx: Context) {
  const query = AdminSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const solutions = await solutionService.findSolutions(query.data)
  const result = AdminSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function exportSolutions (ctx: Context) {
  const query = AdminSolutionListExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const solutions = await solutionService.exportSolutions(query.data)
  const result = AdminSolutionListExportQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function findPosts (ctx: Context) {
  const query = AdminPostListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { page, pageSize, sort, sortBy, title, isPublished, isPinned, isHidden } = query.data
  const posts = await postService.findPosts(
    { page, pageSize, sort, sortBy },
    { title, isPublished, isPinned, isHidden })
  const result = AdminPostListQueryResultSchema.encode(posts)
  return createEnvelopedResponse(ctx, result)
}

export async function getPost (ctx: Context) {
  await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }

  const result = AdminPostDetailQueryResultSchema.encode(postState.post)
  return createEnvelopedResponse(ctx, result)
}

export async function createPost (ctx: Context) {
  const payload = AdminPostCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const { title } = payload.data

  try {
    const post = await postService.createPost({ title })
    ctx.auditLog.info(`<Post:${post.slug}> created by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, { slug: post.slug })
  } catch (err: any) {
    ctx.auditLog.error('Failed to create post', err)
    if (err.code === 11000) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
    }
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updatePost (ctx: Context) {
  const payload = AdminPostUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }
  const { slug } = payload.data
  const post = postState.post

  try {
    if (slug && slug !== post.slug) {
      const exists = await postService.isSlugTaken(slug, post.id)
      if (exists) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
      }
    }

    const updated = await postService.updatePostById(post.id, payload.data)
    if (!updated) {
      return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
    }

    ctx.auditLog.info(`<Post:${updated.slug}> updated by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, { slug: updated.slug })
  } catch (err: any) {
    ctx.auditLog.error('Failed to update post', err)
    if (err.code === 11000) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
    }
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function deletePost (ctx: Context) {
  const profile = await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }

  try {
    await postService.deletePostById(postState.post.id)
    ctx.auditLog.info(`<Post:${postState.post.slug}> deleted by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err: any) {
    ctx.auditLog.error('Failed to delete post', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function sendNotificationBroadcast (ctx: Context) {
  const payload = AdminNotificationCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const { title, content } = payload.data
    await websocketService.sendBroadcastNotification(title, content)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`A notification broadcast was sent by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to send notification broadcast', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function sendNotificationUser (ctx: Context) {
  const payload = AdminNotificationCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const username = String(ctx.params.username)
  if (!username || !(await userService.getUser(username))) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  try {
    const { title, content } = payload.data
    await websocketService.sendUserNotification(username, title, content)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`A notification was sent to <User:${username}> by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to send notification to user', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

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
    ctx.auditLog.info(`<Group:${group.id}> created by <User:${profile.username}>`)
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
    ctx.auditLog.info(`<Group:${groupId}> updated by <User:${profile.username}>`)
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
    const modifiedCount = await groupService.updateGroupMembers(groupId, payload.data.memberIds)
    if (modifiedCount === null) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Group:${groupId}> updated ${modifiedCount} members by <User:${profile.username}>`)
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
    ctx.auditLog.info(`<Group:${groupId}> removed by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to remove group', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function parseDiscussionId (ctx: Context): number | null {
  const discussionIdStr = ctx.params.discussionId
  const discussionId = Number(discussionIdStr)

  if (Number.isNaN(discussionId) || !Number.isInteger(discussionId) || discussionId <= 0) {
    createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid discussion ID')
    return null
  }
  return discussionId
}

export async function updateDiscussion (ctx: Context) {
  const discussionId = parseDiscussionId(ctx)
  if (discussionId === null) {
    return
  }

  const payload = AdminDiscussionUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const update = {} as DiscussionUpdateDto
  if (payload.data.authorId !== undefined) {
    const author = await userService.getUserById(payload.data.authorId)
    if (!author) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Author user not found')
    }
    update.authorId = author.id
  }
  if (payload.data.problemId !== undefined) {
    if (payload.data.problemId === null) {
      update.problemId = null
    } else {
      const problem = await problemService.getProblem(payload.data.problemId)
      if (!problem) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Problem not found')
      }
      update.problemId = problem.id
    }
  }
  if (payload.data.contestId !== undefined) {
    if (payload.data.contestId === null) {
      update.contestId = null
    } else {
      const contest = await contestService.getContest(payload.data.contestId)
      if (!contest) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Contest not found')
      }
      update.contestId = contest.id
    }
  }
  if (payload.data.type !== undefined) {
    update.type = payload.data.type
  }
  if (payload.data.isPinned !== undefined) {
    update.isPinned = payload.data.isPinned
  }
  if (payload.data.title !== undefined) {
    update.title = payload.data.title
  }

  try {
    const result = await discussionService.updateDiscussion(discussionId, update)
    if (!result) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Discussion:${discussionId}> updated by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update discussion', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function parseCommentId (ctx: Context): number | null {
  const commentIdStr = ctx.params.commentId
  const commentId = Number(commentIdStr)

  if (Number.isNaN(commentId) || !Number.isInteger(commentId) || commentId <= 0) {
    createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid comment ID')
    return null
  }
  return commentId
}

export async function updateComment (ctx: Context) {
  const commentId = parseCommentId(ctx)
  if (commentId === null) {
    return
  }

  const payload = AdminCommentUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const result = await discussionService.updateComment(commentId, {
      isHidden: payload.data.isHidden,
    })
    if (!result) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Comment:${commentId}> updated by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update comment', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function listUserSessions (ctx: Context) {
  const user = await loadUser(ctx)
  const sessions = await sessionService.listSessions(String(user.id))

  const currentSessionId = ctx.state.sessionId
  const result = SessionListQueryResultSchema.parse(sessions.map(s => ({
    sessionId: s.sessionId,
    current: s.sessionId === currentSessionId,
    lastAccessAt: s.lastAccessAt,
    loginAt: s.info.loginAt,
    loginIp: s.info.loginIp,
    userAgent: s.info.userAgent,
  })))
  return createEnvelopedResponse(ctx, result)
}

export async function revokeUserSession (ctx: Context) {
  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  const { sessionId } = ctx.params
  if (!sessionId || typeof sessionId !== 'string') {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid session ID')
  }
  if (sessionId === ctx.state.sessionId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Cannot revoke current session, use logout instead')
  }

  await sessionService.revokeSession(String(user.id), sessionId)
  ctx.auditLog.info(`<User:${profile.username}> revoked <Session:${sessionId}> of <User:${user.username}>`)
  return createEnvelopedResponse(ctx, null)
}

export async function revokeUserAllSessions (ctx: Context) {
  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)

  const keepSessionId = user.username === profile.username ? ctx.state.sessionId : ''
  const removed = await sessionService.revokeOtherSessions(String(user.id), keepSessionId || '')
  ctx.auditLog.info(`<User:${profile.username}> revoked all ${removed} session(s) of <User:${user.username}>`)
  const result = SessionRevokeOthersResultSchema.parse({ removed })
  return createEnvelopedResponse(ctx, result)
}

export async function updateAvatarPresets (ctx: Context) {
  const payload = AvatarPresetsEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  await settingsService.setAvatarPresets(payload.data.avatarPresets)
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<User:${profile.username}> updated avatar presets`)
  return createEnvelopedResponse(ctx, payload.data.avatarPresets)
}

export async function findTags (ctx: Context) {
  const tags = await tagService.getTags()
  const result = AdminTagListQueryResultSchema.encode(tags)
  return createEnvelopedResponse(ctx, result)
}

export async function createTag (ctx: Context) {
  const payload = AdminTagCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const tag = await tagService.createTag(payload.data)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Tag:${tag.id}> created by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to create tag', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateTag (ctx: Context) {
  const tagIdStr = ctx.params.tagId
  const tagId = Number(tagIdStr)
  if (Number.isNaN(tagId) || !Number.isInteger(tagId) || tagId <= 0) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid tag ID')
  }

  const payload = AdminTagUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const success = await tagService.updateTag(tagId, payload.data)
    if (!success) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Tag:${tagId}> updated by <User:${profile.username}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update tag', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function triggerScanUploadsFolder (ctx: Context) {
  const task = 'scanUploadsFolder'
  const profile = await loadProfile(ctx)
  await distributeWork(task, '')
  ctx.auditLog.info(`Action <${task}> requested by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, null)
}

export async function findFiles (ctx: Context) {
  const query = AdminFileListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const files = await fileService.findAdminFiles(query.data)
  if (!files) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Uploader not found')
  }

  const result = AdminFileListQueryResultSchema.encode(files)
  return createEnvelopedResponse(ctx, result)
}

export async function removeFile (ctx: Context) {
  const profile = await loadProfile(ctx)
  const storageKey = String(ctx.params.storageKey || '').trim()
  if (!storageKey) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid storage key')
  }

  const file = await fileService.removeFile(profile, storageKey)
  if (!file) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  ctx.auditLog.info(`<File:${file.storageKey}> deleted by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, null)
}

function registerAdminHandlers (router: Router) {
  const adminRouter = new Router({ prefix: '/admin' })

  adminRouter.use(adminRequire)

  adminRouter.get('/users', findUsers)
  adminRouter.get('/users/:username', getUser)
  adminRouter.put('/users/:username', updateUser)
  adminRouter.put('/users/:username/password', updateUserPassword)
  adminRouter.post('/users/batch-register', rootRequire, batchRegisterUsers)
  adminRouter.get('/users/:username/oauth', getUserOAuthConnections)
  adminRouter.delete('/users/:username/oauth/:provider', removeUserOAuthConnection)
  adminRouter.get('/users/:username/sessions', listUserSessions)
  adminRouter.delete('/users/:username/sessions', revokeUserAllSessions)
  adminRouter.delete('/users/:username/sessions/:sessionId', revokeUserSession)

  adminRouter.get('/solutions', findSolutions)
  adminRouter.get('/solutions/export', dataExportLimit, exportSolutions)

  adminRouter.get('/posts', findPosts)
  adminRouter.post('/posts', createPost)
  adminRouter.get('/posts/:slug', getPost)
  adminRouter.put('/posts/:slug', updatePost)
  adminRouter.delete('/posts/:slug', rootRequire, deletePost)

  adminRouter.post('/notifications/broadcast', sendNotificationBroadcast)
  adminRouter.post('/notifications/users/:username', sendNotificationUser)

  adminRouter.get('/groups/:groupId', getGroup)
  adminRouter.post('/groups', createGroup)
  adminRouter.put('/groups/:groupId', updateGroup)
  adminRouter.put('/groups/:groupId/members', updateGroupMembers)
  adminRouter.delete('/groups/:groupId', rootRequire, removeGroup)

  adminRouter.put('/discussions/:discussionId', updateDiscussion)
  adminRouter.put('/comments/:commentId', updateComment)

  adminRouter.put('/settings/avatar-presets', rootRequire, updateAvatarPresets)

  adminRouter.post('/actions/scan-uploads-folder', rootRequire, triggerScanUploadsFolder)

  adminRouter.get('/files', findFiles)
  adminRouter.delete('/files/:storageKey', removeFile)

  adminRouter.get('/tags', findTags)
  adminRouter.post('/tags', createTag)
  adminRouter.put('/tags/:tagId', updateTag)

  router.use(adminRouter.routes(), adminRouter.allowedMethods())
}

export default registerAdminHandlers
