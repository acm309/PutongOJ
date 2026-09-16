import type { Types } from 'mongoose'
import type { TagModel } from './model/tag.js'
import type { UserModel } from './model/user.js'

export type Entity = {
  createdAt: Date
  updatedAt: Date
}

export type View = {
  createdAt: number
  updatedAt: number
}

export type CourseRole = {
  basic: boolean
  viewTestcase: boolean
  viewSolution: boolean
  manageProblem: boolean
  manageContest: boolean
  manageCourse: boolean
}

export type CourseEntity = {
  courseId: number
  name: string
  description: string
  encrypt: 1 | 2
  joinCode: string
} & Entity

export type CourseEntityEditable = Pick<CourseEntity, 'name' | 'description' | 'encrypt' | 'joinCode'>

export type CourseEntityItem = Pick<CourseEntity, 'courseId' | 'name'>

export type CourseEntityView = {
  canJoin: boolean
} & Pick<CourseEntity, 'courseId' | 'name' | 'description' | 'encrypt'>
& Partial<Pick<CourseEntity, 'joinCode'>>

export type CourseEntityViewWithRole = CourseEntityView & {
  role: CourseRole
}

export type CourseEntityPreview = Pick<CourseEntity, 'courseId' | 'name' | 'description' | 'encrypt'>

export type CourseEntityPreviewWithRole = CourseEntityPreview & {
  role: CourseRole
}

export type CourseMemberEntity = {
  user: Types.ObjectId
  course: Types.ObjectId
  role: CourseRole
} & Entity

export type CourseMemberView = {
  user: Pick<UserEntity, 'uid' | 'nick' | 'privilege'>
} & Pick<CourseMemberEntity, 'role'> & View

export type CourseProblemEntity = {
  course: Types.ObjectId
  problem: Types.ObjectId
  sort: number
} & Entity

export type UserEntity = {} & UserModel

export type ProblemEntity = {
  pid: number
  title: string
  /** Time limit in milliseconds */
  time: number
  /** Memory limit in kilobytes */
  memory: number
  description: string
  /** Input format description */
  input: string
  /** Output format description */
  output: string
  /** Input example */
  in: string
  /** Output example */
  out: string
  hint: string
  status: 0 | 2
  /** Judge type */
  type: 1 | 2 | 3
  /** Judger code */
  code: string
  tags: Types.ObjectId[]
  owner: Types.ObjectId | null
  submit: number
  solve: number
} & Entity

export type ProblemEntityForm = Pick<ProblemEntity, 'title' | 'time' | 'memory' | 'description' | 'input' | 'output' | 'in'
  | 'out' | 'hint' | 'status' | 'type' | 'code' | 'owner'> & {
    tags?: number[]
  }

export type ProblemEntityItem = Pick<ProblemEntity, 'pid' | 'title'>

export type ProblemEntityPreview = Pick<ProblemEntity, 'pid' | 'title' | 'status' | 'type' | 'submit' | 'solve'> & {
  isOwner?: boolean
  tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
}

export type ProblemEntityView = Pick<ProblemEntity, 'pid' | 'title' | 'time' | 'memory' | 'status' | 'description'
  | 'input' | 'output' | 'in' | 'out' | 'hint'> & Partial<Pick<ProblemEntity, 'type' | 'code'>> & {
    isOwner: boolean
    tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
  }

export type SolutionEntity = {
  sid: number
  pid: number
  uid: string
  mid: number
  course: Types.ObjectId | CourseEntity | null
  code: string
  length: number
  language: number
  create: number
  status: number
  judge: number
  time: number
  memory: number
  error: string
  sim: number
  sim_s_id: number
  testcases: {
    uuid: string
    judge: number
    time: number
    memory: number
  }[]
} & Entity

export type GroupEntity = {
  gid: number
  title: string
  list: string[]
  create: number
} & Entity
