/**
 * Persistence types are generated from the Prisma schema. Shared code only
 * defines business value objects that do not correspond to a database model.
 */
export type {
  Comment as CommentEntity,
  Contest as ContestEntity,
  Course as CourseEntity,
  CourseMember as CourseMemberEntity,
  CourseProblem as CourseProblemEntity,
  DiscussionCommentStats as DiscussionCommentStatsEntity,
  Discussion as DiscussionEntity,
  File as FileEntity,
  Group as GroupEntity,
  OAuthConnection as OAuthConnectionEntity,
  Post as PostEntity,
  Problem as ProblemEntity,
  ProblemSubmissionStats as ProblemSubmissionStatsEntity,
  Submission as SubmissionEntity,
  Tag as TagEntity,
  User as UserEntity,
  UserProblemStatus as UserProblemStatusEntity,
  UserSubmissionStats as UserSubmissionStatsEntity,
} from '@putongoj/db/browser'

export type CourseRole = {
  canAccess: boolean
  canViewTestcases: boolean
  canViewSubmissions: boolean
  canManageProblems: boolean
  canManageContests: boolean
  canManageCourse: boolean
}

export const courseRoleNone: Readonly<CourseRole> = Object.freeze({
  canAccess: false,
  canViewTestcases: false,
  canViewSubmissions: false,
  canManageProblems: false,
  canManageContests: false,
  canManageCourse: false,
})

export const courseRoleEntire: Readonly<CourseRole> = Object.freeze({
  canAccess: true,
  canViewTestcases: true,
  canViewSubmissions: true,
  canManageProblems: true,
  canManageContests: true,
  canManageCourse: true,
})
