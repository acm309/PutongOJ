import type { FileListQuery, FileListQueryResult } from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findFiles (params: FileListQuery) {
  return instance.get<FileListQueryResult>('/files', { params })
}
export async function removeFile (storageKey: string) {
  return instance.delete<null>(`/files/${encodeURIComponent(storageKey)}`)
}
