import type { Logger } from '../../../logger.ts'
import type {
  PipeMap,
  PreparedFile,
  SandboxCmd,
  SandboxResult,
} from './types.ts'
import { createLogger } from '../../../logger.ts'
import { FileCache } from './file-cache.ts'
import { SandboxResultSchema } from './types.ts'

interface RunRequest {
  cmd: SandboxCmd[]
  pipeMapping?: PipeMap[]
}

export class SandboxClient {
  readonly endpoint: string
  readonly cache: FileCache
  private readonly logger: Logger

  constructor (endpoint: string) {
    this.endpoint = endpoint.replace(/\/+$/, '')
    this.logger = createLogger('judger.sandbox-client')
    this.cache = new FileCache(this)
  }

  toString (): string {
    return `SandboxClient(endpoint='${this.endpoint}')`
  }

  async close (): Promise<void> {
    await this.cache.close()
    this.logger.debug('Sandbox client closed')
  }

  private async request (path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.endpoint}${path}`, init)
    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `Sandbox request ${init?.method ?? 'GET'} ${path} failed with `
        + `${response.status} ${response.statusText}: ${body}`,
      )
    }
    return response
  }

  async runCommand (
    commands: SandboxCmd[],
    pipeMapping?: PipeMap[],
  ): Promise<SandboxResult[]> {
    const payload: RunRequest = { cmd: commands }
    if (pipeMapping) {
      payload.pipeMapping = pipeMapping
    }

    const response = await this.request('/run', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const raw = await response.json() as unknown
    if (!Array.isArray(raw)) {
      throw new TypeError('Sandbox /run response must be an array')
    }
    return raw.map(result => SandboxResultSchema.parse(result))
  }

  async uploadFile (
    content: string,
    filename = 'file.txt',
  ): Promise<PreparedFile> {
    const form = new FormData()
    form.append('file', new Blob([ content ]), filename)

    const response = await this.request('/file', {
      method: 'POST',
      body: form,
    })
    const fileId = await response.json() as unknown
    if (typeof fileId !== 'string') {
      throw new TypeError('Sandbox /file response must contain a file id')
    }
    return { fileId }
  }

  async downloadFile (fileId: string): Promise<string | undefined> {
    const response = await fetch(`${this.endpoint}/file/${encodeURIComponent(fileId)}`)
    const result = await response.text()
    if (response.ok) {
      return result
    }

    this.logger.warn(
      `Failed to download file '${fileId}': ${response.status} ${result}`,
    )
    return undefined
  }

  async deleteFile (fileId: string): Promise<boolean> {
    const response = await fetch(`${this.endpoint}/file/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      return true
    }

    const body = await response.text()
    this.logger.warn(
      `Failed to delete file '${fileId}': ${response.status} ${body}`,
    )
    return false
  }

  async getVersion (): Promise<Record<string, unknown>> {
    const response = await this.request('/version')
    const result = await response.json() as unknown
    if (result === null || typeof result !== 'object' || Array.isArray(result)) {
      throw new TypeError('Sandbox /version response must be an object')
    }
    return result as Record<string, unknown>
  }
}
