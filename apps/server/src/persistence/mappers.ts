import type {
  Comment,
  Discussion,
  Problem,
  User,
} from '@putongoj/db'
import type { CourseRole } from '@putongoj/shared'
import type { AuthenticatedUser } from './types'
import { UserPrivilege } from '@putongoj/shared'

export function toAuthenticatedUser (user: User): AuthenticatedUser {
  return {
    ...user,
    isBanned: user.privilege === UserPrivilege.BANNED,
    isAdmin: user.privilege === UserPrivilege.ADMIN || user.privilege === UserPrivilege.ROOT,
    isRoot: user.privilege === UserPrivilege.ROOT,
  }
}

export function toCourseRole (member: {
  canAccess: boolean
  canViewTestcases: boolean
  canViewSubmissions: boolean
  canManageProblems: boolean
  canManageContests: boolean
  canManageCourse: boolean
}): CourseRole {
  return {
    canAccess: member.canAccess,
    canViewTestcases: member.canViewTestcases,
    canViewSubmissions: member.canViewSubmissions,
    canManageProblems: member.canManageProblems,
    canManageContests: member.canManageContests,
    canManageCourse: member.canManageCourse,
  }
}

export function toProblemDto (
  problem: Problem,
  statistics?: { submitterCount: number, solverCount: number } | null,
) {
  return {
    id: problem.id,
    title: problem.title,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    sampleInput: problem.sampleInput,
    sampleOutput: problem.sampleOutput,
    hint: problem.hint,
    visibility: problem.visibility,
    judgeType: problem.judgeType,
    judgeCode: problem.judgeCode,
    ownerId: problem.ownerId,
    statistics: {
      submitterCount: statistics?.submitterCount ?? 0,
      solverCount: statistics?.solverCount ?? 0,
    },
    createdAt: problem.createdAt,
    updatedAt: problem.updatedAt,
  }
}

export function toDiscussionDto (
  discussion: Discussion,
  statistics?: { visibleCommentCount: number, lastVisibleCommentAt: Date } | null,
) {
  return {
    id: discussion.id,
    authorId: discussion.authorId,
    problemId: discussion.problemId,
    contestId: discussion.contestId,
    type: discussion.type,
    isPinned: discussion.isPinned,
    title: discussion.title,
    comments: statistics?.visibleCommentCount ?? 0,
    lastCommentAt: statistics?.lastVisibleCommentAt ?? discussion.createdAt,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
  }
}

export function toCommentDto (comment: Comment) {
  return {
    id: comment.id,
    discussionId: comment.discussionId,
    authorId: comment.authorId,
    content: comment.content,
    isHidden: comment.isHidden,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}
