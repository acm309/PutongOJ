import type { Context as KoaContext } from 'koa'
import type { UserDocument } from '../models/User'

export interface AppSession {
  profile?: SessionProfile
}

export interface AppState {
  authnChecked?: boolean
  profile?: UserDocument
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
