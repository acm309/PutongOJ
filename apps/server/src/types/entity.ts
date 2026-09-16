import type {
  CourseEntity,
  CourseRole,
  ProblemEntity,
  TagModel,
} from '@putong-oj/shared'

export type {
  CourseEntity,
  CourseMemberEntity,
  CourseMemberView,
  CourseProblemEntity,
  Entity,
  GroupEntity,
  ProblemEntity,
  SolutionEntity,
  UserEntity,
  View,
} from '@putong-oj/shared'

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
  tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
}

export type ProblemEntityView = Pick<ProblemEntity,
  'pid' | 'title' | 'time' | 'memory' | 'status' | 'description'
  | 'input' | 'output' | 'in' | 'out' | 'hint'
> & Partial<Pick<ProblemEntity, 'type' | 'code'>> & {
  isOwner: boolean
  tags: Pick<TagModel, 'tagId' | 'name' | 'color'>[]
}
