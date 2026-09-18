import type { JudgeStatus } from '@putong-oj/shared'
import type { SandboxResult, SandboxStatusValue as SandboxStatusName } from '../sandbox/types.ts'
import { JudgeStatus as JudgeStatusValue } from '@putong-oj/shared'
import { SandboxStatus as SandboxStatusValue } from '../sandbox/types.ts'

export const JUDGE_STATUS_PRIORITY: JudgeStatus[] = [
  JudgeStatusValue.SystemError,
  JudgeStatusValue.OutputLimitExceeded,
  JudgeStatusValue.MemoryLimitExceeded,
  JudgeStatusValue.TimeLimitExceeded,
  JudgeStatusValue.RuntimeError,
  JudgeStatusValue.WrongAnswer,
  JudgeStatusValue.PresentationError,
]

export const SKIP_STATUS = new Set<JudgeStatus>([
  JudgeStatusValue.MemoryLimitExceeded,
  JudgeStatusValue.TimeLimitExceeded,
  JudgeStatusValue.OutputLimitExceeded,
])

const SANDBOX_STATUS_MAP = new Map<SandboxStatusName, JudgeStatus>([
  [ SandboxStatusValue.MemoryLimitExceeded, JudgeStatusValue.MemoryLimitExceeded ],
  [ SandboxStatusValue.TimeLimitExceeded, JudgeStatusValue.TimeLimitExceeded ],
  [ SandboxStatusValue.OutputLimitExceeded, JudgeStatusValue.OutputLimitExceeded ],
  [ SandboxStatusValue.NonzeroExitStatus, JudgeStatusValue.RuntimeError ],
  [ SandboxStatusValue.Signalled, JudgeStatusValue.RuntimeError ],
])

export function judgeStatusFromSandbox (status: SandboxStatusName): JudgeStatus {
  return SANDBOX_STATUS_MAP.get(status) ?? JudgeStatusValue.SystemError
}

export function judgeStatusFromChecker (result: SandboxResult): JudgeStatus {
  if (result.status === SandboxStatusValue.Accepted) {
    return JudgeStatusValue.Accepted
  }
  if (result.status === SandboxStatusValue.NonzeroExitStatus) {
    if (result.exitStatus === 1) {
      return JudgeStatusValue.WrongAnswer
    }
    if (result.exitStatus === 2) {
      return JudgeStatusValue.PresentationError
    }
    if (result.exitStatus === 3) {
      return JudgeStatusValue.SystemError
    }
  }
  return JudgeStatusValue.SystemError
}
