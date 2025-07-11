import type { ObjectId } from 'mongoose'
import type { CourseRole } from '.'
import type { encrypt } from '../utils/constants'

interface EntityTimestamps {
  createdAt: Date
  updatedAt: Date
}

interface Entity extends EntityTimestamps { }

export interface UserEntity extends Entity {
  uid: string
  pwd: string
  privilege: number
  nick: string
  motto: string
  mail: string
  school: string
  gid: number[]
  submit: number
  solve: number
}

export interface CourseEntity extends Entity {
  courseId: number
  name: string
  description: string
  encrypt: typeof encrypt.Public | typeof encrypt.Private
}

export type CourseEntityEditable = Pick<CourseEntity,
  'name' | 'description' | 'encrypt'
>

export type CourseEntityLimited = Pick<CourseEntity,
  'courseId' | 'name' | 'description' | 'encrypt'
>

export interface CoursePermEntity extends Entity {
  user: ObjectId
  course: ObjectId
  role: CourseRole
}

export interface CourseMemberEntity extends Omit<CoursePermEntity, 'course'> {
  user: Pick<UserEntity, 'uid' | 'nick' | 'privilege'>
}
