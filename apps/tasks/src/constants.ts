export const TASK_QUEUE_NAME = 'judger:task'
export const RESULT_QUEUE_NAME = 'judger:result'

export const DEFAULT_TIME_LIMIT = 10_000_000_000
export const DEFAULT_MEMORY_LIMIT = 512 * 1024 * 1024
export const DEFAULT_PROC_LIMIT = 64
export const DEFAULT_CPU_RATE_LIMIT = 1000
export const DEFAULT_OUTPUT_LIMIT = 16 * 1024 * 1024

export const DEFAULT_SANDBOX_ENV = [ 'PATH=/usr/bin:/bin', 'ONLINE_JUDGE=1' ]
