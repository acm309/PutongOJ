import type { QuerySelector } from 'mongoose'

interface RootQuerySelector<T> {
  $and?: Array<FilterQuery<T>>
  $nor?: Array<FilterQuery<T>>
  $or?: Array<FilterQuery<T>>
}

type Condition<T> = T | QuerySelector<T>

export type FilterQuery<T> = ({ [P in keyof T]?: Condition<T[P]>; } & RootQuerySelector<T>)
