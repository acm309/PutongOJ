import type { TagModel } from './model/tag.js'

export interface CourseRole {
  basic: boolean
  viewTestcase: boolean
  viewSolution: boolean
  manageProblem: boolean
  manageContest: boolean
  manageCourse: boolean
}

export const courseRoleNone: Readonly<CourseRole> = Object.freeze({
  basic: false,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
})

export const courseRoleEntire: Readonly<CourseRole> = Object.freeze({
  basic: true,
  viewTestcase: true,
  viewSolution: true,
  manageProblem: true,
  manageContest: true,
  manageCourse: true,
})

export interface CourseEntity {
  courseId: number
  name: string
  description: string
  encrypt: 1 | 2
  joinCode: string
  createdAt: Date
  updatedAt: Date
}

export type CourseEntityEditable = Pick<CourseEntity,
  'name' | 'description' | 'encrypt' | 'joinCode'
>

export type CourseEntityItem = Pick<CourseEntity, 'courseId' | 'name'>

export interface CourseEntityView extends
  Pick<CourseEntity, 'courseId' | 'name' | 'description' | 'encrypt'>,
  Partial<Pick<CourseEntity, 'joinCode'>> {
  canJoin: boolean
}

export interface CourseEntityViewWithRole extends CourseEntityView {
  role: CourseRole
}

export type CourseEntityPreview = Pick<CourseEntity,
  'courseId' | 'name' | 'description' | 'encrypt'
>

export interface CourseMemberView {
  role: CourseRole
  user: {
    uid: string
    nick: string
    privilege: number
  }
  createdAt: number
  updatedAt: number
}

export interface ProblemEntity {
  pid: number
  title: string
  time: number
  memory: number
  description: string
  input: string
  output: string
  in: string
  out: string
  hint: string
  status: 0 | 2
  type: 1 | 2 | 3
  code: string
  submit: number
  solve: number
  createdAt: Date
  updatedAt: Date
}

export type ProblemEntityForm = Pick<ProblemEntity,
  'title' | 'time' | 'memory' | 'description' | 'input' | 'output' | 'in'
  | 'out' | 'hint' | 'status' | 'type' | 'code'
> & {
  owner?: string | null
  tags?: number[]
}

export type ProblemEntityItem = Pick<ProblemEntity, 'pid' | 'title'>

export type ProblemEntityPreview = Pick<ProblemEntity,
  'pid' | 'title' | 'status' | 'type' | 'submit' | 'solve'
> & {
  isOwner?: boolean
  tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
}

export type ProblemEntityView = Pick<ProblemEntity,
  'pid' | 'title' | 'time' | 'memory' | 'status' | 'description'
  | 'input' | 'output' | 'in' | 'out' | 'hint'
> & Partial<Pick<ProblemEntity, 'type' | 'code'>> & {
  isOwner: boolean
  tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
}

export interface SolutionEntity {
  sid: number
  pid: number
  uid: string
  mid: number
  code: string
  language: number
  judge: number
  time: number
  memory: number
  error: string
  sim: number
  sim_s_id: number
  createdAt: Date
  updatedAt: Date
}
