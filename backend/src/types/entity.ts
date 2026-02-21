import type { TagColor } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { ContestOption, CourseRole } from '.'
import type { CourseDocument } from '../models/Course'
import type { UserEntity } from '../models/User'
import type { encrypt, problemType, status } from '../utils/constants'

// Common

interface EntityTimestamps {
  createdAt: Date
  updatedAt: Date
}

export interface Entity extends EntityTimestamps { }

interface ViewTimestamps {
  createdAt: number
  updatedAt: number
}

export interface View extends ViewTimestamps { }

// Course

export interface CourseEntity extends Entity {
  courseId: number
  name: string
  description: string
  encrypt: typeof encrypt.Public | typeof encrypt.Private
  joinCode: string
}

export type CourseEntityEditable = Pick<CourseEntity,
  'name' | 'description' | 'encrypt' | 'joinCode'
>

export type CourseEntityItem = Pick<CourseEntity,
  'courseId' | 'name'
>

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

export interface CourseEntityPreviewWithRole extends CourseEntityPreview {
  role: CourseRole
}

// Course Member

export interface CourseMemberEntity extends Entity {
  user: Types.ObjectId
  course: Types.ObjectId
  role: CourseRole
}

export interface CourseMemberView extends Pick<CourseMemberEntity, 'role'>, View {
  user: Pick<UserEntity, 'uid' | 'nick' | 'privilege'>
}

// Course Problem

export interface CourseProblemEntity extends Entity {
  course: Types.ObjectId
  problem: Types.ObjectId
  sort: number
}

// Problem

export interface ProblemEntity extends Entity {
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
  status: typeof status[keyof typeof status]
  /** Judge type */
  type: typeof problemType[keyof typeof problemType]
  /** Judger code */
  code: string
  tags: Types.ObjectId[]
  owner: Types.ObjectId | null
  submit: number
  solve: number
}

export type ProblemEntityForm = Pick<ProblemEntity,
  'title' | 'time' | 'memory' | 'description' | 'input' | 'output' | 'in'
  | 'out' | 'hint' | 'status' | 'type' | 'code' | 'owner'
> & {
  tags?: number[]
}

export type ProblemEntityItem = Pick<ProblemEntity,
  'pid' | 'title'
>

export type ProblemEntityPreview = Pick<ProblemEntity,
  'pid' | 'title' | 'status' | 'type' | 'submit' | 'solve'
> & {
  isOwner?: boolean
  tags: TagEntityItem[]
}

export type ProblemEntityView = Pick<ProblemEntity,
  'pid' | 'title' | 'time' | 'memory' | 'status' | 'description'
  | 'input' | 'output' | 'in' | 'out' | 'hint'
> & Partial<Pick<ProblemEntity, 'type' | 'code'>> & {
  isOwner: boolean
  tags: TagEntityItem[]
}

// Contest

export interface ContestEntity extends Entity {
  cid: number
  title: string
  start: number
  end: number
  list: number[]
  status: number
  encrypt: number
  argument: string
  option: ContestOption
  course: CourseDocument | null
}

export type ContestEntityEditable = Pick<ContestEntity,
  'title' | 'start' | 'end' | 'list' | 'status' | 'encrypt' | 'argument' | 'option'
> & { course?: Types.ObjectId | null }

export type ContestEntityPreview = Pick<ContestEntity,
  'cid' | 'title' | 'start' | 'end' | 'status' | 'encrypt'
>

export type ContestEntityView = Pick<ContestEntity,
  'cid' | 'title' | 'start' | 'end' | 'status' | 'encrypt' | 'list' | 'option'
> & Partial<Pick<ContestEntity, 'argument'>> & {
  course: CourseEntityPreviewWithRole | null
}

// Solution

export interface SolutionEntity extends Entity {
  sid: number
  pid: number
  uid: string
  mid: number
  course: CourseDocument | null
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
}

// News

export interface NewsEntity extends Entity {
  nid: number
  title: string
  content: string
  status: number
  /** @deprecated Use `createdAt` instead */
  create: number
}

// Tag

export interface TagEntity extends Entity {
  tagId: number
  name: string
  color: TagColor
}

export type TagEntityForm = Pick<TagEntity,
  'name' | 'color'
>

export type TagEntityItem = Pick<TagEntity,
  'tagId' | 'name' | 'color'
>

export type TagEntityPreview = Pick<TagEntity,
  'tagId' | 'name' | 'color'
> & View

export type TagEntityView = TagEntityPreview

// Group

export interface GroupEntity extends Entity {
  gid: number
  title: string
  list: string[]
  create: number
}

// Discuss

export interface DiscussEntity extends Entity {
  did: number
  title: string
  uid: string
  comments: {
    uid: string
    content: string
    create: number
  }[]
  create: number
  update: number
}
