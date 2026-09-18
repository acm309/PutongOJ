import { z } from 'zod'
import {
  DEFAULT_CPU_RATE_LIMIT,
  DEFAULT_MEMORY_LIMIT,
  DEFAULT_OUTPUT_LIMIT,
  DEFAULT_PROC_LIMIT,
  DEFAULT_SANDBOX_ENV,
  DEFAULT_TIME_LIMIT,
} from '../constants.ts'

export const SandboxStatus = {
  Accepted: 'Accepted',
  MemoryLimitExceeded: 'Memory Limit Exceeded',
  TimeLimitExceeded: 'Time Limit Exceeded',
  OutputLimitExceeded: 'Output Limit Exceeded',
  FileError: 'File Error',
  NonzeroExitStatus: 'Nonzero Exit Status',
  Signalled: 'Signalled',
  InternalError: 'Internal Error',
} as const

export type SandboxStatusValue = typeof SandboxStatus[keyof typeof SandboxStatus]

export const SandboxStatusValues = [
  SandboxStatus.Accepted,
  SandboxStatus.MemoryLimitExceeded,
  SandboxStatus.TimeLimitExceeded,
  SandboxStatus.OutputLimitExceeded,
  SandboxStatus.FileError,
  SandboxStatus.NonzeroExitStatus,
  SandboxStatus.Signalled,
  SandboxStatus.InternalError,
] as const

export interface LocalFile {
  src: string
}

export interface MemoryFile {
  content: string
}

export interface PreparedFile {
  fileId: string
}

export interface Collector {
  name: string
  max: number
}

export type SandboxInputFile = LocalFile | MemoryFile | PreparedFile
export type SandboxFile = SandboxInputFile | Collector | null

export interface SandboxCmd {
  args: string[]
  env: string[]
  files: SandboxFile[]
  cpuLimit: number
  clockLimit: number
  memoryLimit: number
  procLimit: number
  cpuRateLimit: number
  copyIn: Record<string, SandboxInputFile>
  copyOut: string[]
  copyOutCached: string[]
  copyOutMax: number
}

export interface PipeIndex {
  index: number
  fd: number
}

export interface PipeMap {
  in: PipeIndex
  out: PipeIndex
  name?: string
  max?: number
  proxy?: boolean
  disableZeroCopy?: boolean
}

export const localFile = (src: string): LocalFile => ({ src })
export const memoryFile = (content: string): MemoryFile => ({ content })
export const preparedFile = (fileId: string): PreparedFile => ({ fileId })
export const collector = (
  name: string,
  max: number = DEFAULT_OUTPUT_LIMIT,
): Collector => ({ name, max })

export function createSandboxCmd (
  options: Partial<SandboxCmd> & Pick<SandboxCmd, 'args'>,
): SandboxCmd {
  return {
    args: options.args,
    env: options.env ? [ ...options.env ] : [ ...DEFAULT_SANDBOX_ENV ],
    files: options.files ? [ ...options.files ] : [],
    cpuLimit: options.cpuLimit ?? DEFAULT_TIME_LIMIT,
    clockLimit: options.clockLimit ?? DEFAULT_TIME_LIMIT * 2,
    memoryLimit: options.memoryLimit ?? DEFAULT_MEMORY_LIMIT,
    procLimit: options.procLimit ?? DEFAULT_PROC_LIMIT,
    cpuRateLimit: options.cpuRateLimit ?? DEFAULT_CPU_RATE_LIMIT,
    copyIn: options.copyIn ? { ...options.copyIn } : {},
    copyOut: options.copyOut ? [ ...options.copyOut ] : [],
    copyOutCached: options.copyOutCached ? [ ...options.copyOutCached ] : [],
    copyOutMax: options.copyOutMax ?? DEFAULT_OUTPUT_LIMIT,
  }
}

const FileErrorSchema = z.object({
  name: z.string(),
  type: z.union([ z.string(), z.number() ]),
  message: z.string().optional(),
})

export const SandboxResultSchema = z.object({
  status: z.enum(SandboxStatusValues),
  error: z.string().optional(),
  exitStatus: z.int().default(0),
  time: z.int().nonnegative().default(0),
  memory: z.int().nonnegative().default(0),
  procPeak: z.int().nonnegative().optional(),
  runTime: z.int().nonnegative().default(0),
  files: z.record(z.string(), z.string()).optional(),
  fileIds: z.record(z.string(), z.string()).optional(),
  fileError: z.array(FileErrorSchema).optional(),
})

export type SandboxResult = z.infer<typeof SandboxResultSchema>
