import type {
  Comment,
  Contest,
  Course,
  CourseMember,
  Discussion,
  Problem,
  Submission,
  Tag,
  User,
} from '@putongoj/db'

export type AuthenticatedUser = User & {
  isBanned: boolean
  isAdmin: boolean
  isRoot: boolean
}

export type ProblemRecord = Problem & {
  tags?: Array<{ tag: Tag }>
  submissionStats?: {
    submitterCount: number
    solverCount: number
  } | null
}

export type CourseRecord = Course

export type ContestRecord = Contest & {
  course?: Course | null
  problems?: Array<{
    position: number
    problem: Problem
  }>
}

export type SubmissionRecord = Submission
export type DiscussionRecord = Discussion
export type CommentRecord = Comment
export type CourseMemberRecord = CourseMember
