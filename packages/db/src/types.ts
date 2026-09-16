import type {
  CommentModel,
  CourseEntity,
  CourseMemberEntity,
  CourseProblemEntity,
  DiscussionModel,
  Entity,
  GroupEntity,
  OAuthConnection,
  ProblemEntity,
  SolutionEntity,
  TagModel,
  UserEntity,
} from '@putong-oj/shared'
import type { Document, Types } from 'mongoose'
import 'mongoose-paginate-v2'

export type ObjectId = Types.ObjectId

export type CourseDocument = {
  isPublic: boolean
  isPrivate: boolean
  canJoin: boolean
} & Document<Types.ObjectId> & CourseEntity

export type CourseMemberDocument = Document<Types.ObjectId> & CourseMemberEntity

export type CourseProblemDocument = Document<Types.ObjectId> & CourseProblemEntity

export type UserDocument = {
  isBanned: boolean
  isAdmin: boolean
  isRoot: boolean
} & Document<Types.ObjectId> & UserEntity

export type ProblemDocument = Document<Types.ObjectId> & ProblemEntity

export type ProblemDocumentPopulated = Omit<ProblemDocument, 'tags'> & {
  tags: TagModel[]
}

export type SolutionDocument = {
  isAccepted: boolean
  isPending: boolean
} & Document<Types.ObjectId> & SolutionEntity

export type GroupDocument = Document<Types.ObjectId> & GroupEntity

export type CommentDocument = Document<Types.ObjectId> & CommentModel

export type DiscussionDocument = Document<Types.ObjectId> & DiscussionModel

export type OAuthEntity = {
  user: Types.ObjectId
} & Entity & OAuthConnection

export type OAuthDocument = Document<Types.ObjectId> & OAuthEntity

export type OAuthDocumentPopulated = OAuthDocument & {
  user: UserDocument
}
