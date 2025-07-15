import type { ObjectId } from 'mongoose'
import type { CourseRole } from '.'
import type { encrypt } from '../utils/constants'

// Common

interface EntityTimestamps {
  createdAt: Date
  updatedAt: Date
}

interface Entity extends EntityTimestamps { }

// User

export interface UserEntity extends Entity {
  /** Unique user ID (Case-insensitive) */
  uid: string
  /** User password (hashed) */
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
  status: number
  /** Judge type */
  type: number
  /** Judger code */
  code: string
  tags: string[]
  course: ObjectId | null
  submit: number
  solve: number
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
  course: ObjectId | null
}

// Course

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

// Course Permission

export interface CoursePermEntity extends Entity {
  user: ObjectId
  course: ObjectId
  role: CourseRole
}

export interface CourseMemberEntity extends Omit<CoursePermEntity, 'course'> {
  user: Pick<UserEntity, 'uid' | 'nick' | 'privilege'>
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
