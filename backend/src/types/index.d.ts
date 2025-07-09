import type { Context as KoaContext } from 'koa'
import type { UserEntity } from '../models/User'

export interface AppSession {
  profile?: SessionProfile
}

export interface AppState {
  authnChecked?: boolean
  profile?: UserEntity
}

export interface AppContext extends KoaContext {
  session: AppSession
  state: AppState
}

export interface SessionProfile {
  uid: string
  nick: string
  privilege: number
  pwd: string
}
