import type { FileListQuery, FileListQueryResult } from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findFiles (params: FileListQuery) {
  return apiClient.get<FileListQueryResult>('/files', { params })
}
export async function removeFile (storageKey: string) {
  return apiClient.delete<null>(`/files/${encodeURIComponent(storageKey)}`)
}
