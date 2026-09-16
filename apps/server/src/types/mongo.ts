import type { mongo } from '@putong-oj/db'

interface RootQuerySelector<T> {
  $and?: Array<QueryFilter<T>>
  $nor?: Array<QueryFilter<T>>
  $or?: Array<QueryFilter<T>>
}

type Condition<T> = T | mongo.FilterOperators<T>

export type QueryFilter<T> = ({ [P in keyof T]?: Condition<T[P]>; } & RootQuerySelector<T>)
