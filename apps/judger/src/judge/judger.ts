import type {
  JudgerResult,
  JudgerTask,
  JudgerTestcase,
  JudgerTestcaseResult,
} from '@putong-oj/shared'
import type { LanguageConfig } from '../languages/registry.ts'
import type { SandboxClient } from '../sandbox/client.ts'
import type { PreparedFile, SandboxResult } from '../sandbox/types.ts'
import { JudgeStatus, problemType } from '@putong-oj/shared'
import { DEFAULT_CHECKER_CODE } from '../assets.ts'
import { LanguageRegistry } from '../languages/registry.ts'
import { createLogger } from '../logger.ts'
import {
  collector,
  createSandboxCmd,
  memoryFile,
  preparedFile,
  SandboxStatus,
} from '../sandbox/types.ts'
import {
  JUDGE_STATUS_PRIORITY,
  judgeStatusFromSandbox,
  SKIP_STATUS,
} from './status.ts'
import { TestlibChecker } from './testlib-checker.ts'

export class Judger {
  private readonly client: SandboxClient
  private readonly submission: JudgerTask
  private readonly result: JudgerResult
  private readonly checker: TestlibChecker
  private readonly logger = createLogger('judger.judger')
  private readonly cleanupTasks = new Set<Promise<unknown>>()
  private readonly languageConfig?: LanguageConfig
  private compiledFile?: PreparedFile

  constructor (
    client: SandboxClient,
    submission: JudgerTask,
  ) {
    this.client = client
    this.submission = submission
    this.result = {
      sid: submission.sid,
      time: 0,
      memory: 0,
      testcases: [],
      judge: JudgeStatus.Pending,
      error: '',
    }

    try {
      this.languageConfig = LanguageRegistry.getConfig(submission.language)
    } catch (error) {
      this.result.judge = JudgeStatus.SystemError
      this.logger.error(
        `Submission ${submission.sid} failed on initialization: `
        + `unsupported language ${submission.language}`,
        error,
      )
    }

    this.checker = new TestlibChecker(
      client,
      submission.type === problemType.Traditional
        ? DEFAULT_CHECKER_CODE
        : submission.additionCode,
    )
    this.logger.debug(`Submission ${submission.sid} initialized`)
  }

  private trackCleanup (promise: Promise<unknown>): void {
    this.cleanupTasks.add(promise)
    void promise
      .catch((error) => {
        this.logger.warn(
          `Submission ${this.submission.sid} cleanup task failed:`,
          error,
        )
      })
      .finally(() => {
        this.cleanupTasks.delete(promise)
      })
  }

  private getRuntimeDependencies (): Record<string, PreparedFile | { content: string }> {
    if (!this.languageConfig) {
      throw new Error('Language config is unavailable')
    }
    if (this.languageConfig.needCompile) {
      if (!this.compiledFile) {
        throw new Error('Compiled file is unavailable')
      }
      const dependencies: Record<string, PreparedFile | { content: string }> = {}
      dependencies[this.languageConfig.compiledFilename] = this.compiledFile
      return dependencies
    }

    const dependencies: Record<string, PreparedFile | { content: string }> = {}
    dependencies[this.languageConfig.sourceFilename] = memoryFile(this.submission.code)
    return dependencies
  }

  private getLimits (): { timeLimit: number, memoryLimit: number } {
    if (!this.languageConfig) {
      throw new Error('Language config is unavailable')
    }
    return {
      timeLimit: 1_000_000
        * this.submission.timeLimit
        * this.languageConfig.timeFactor,
      memoryLimit: 1024
        * this.submission.memoryLimit
        * this.languageConfig.memoryFactor,
    }
  }

  async compile (): Promise<void> {
    if (this.compiledFile) {
      this.logger.warn(`Submission ${this.submission.sid} already compiled`)
      return
    }
    if (!this.languageConfig) {
      this.result.judge = JudgeStatus.SystemError
      return
    }

    this.logger.debug(`Submission ${this.submission.sid} compiling`)
    try {
      const command = createSandboxCmd({
        args: this.languageConfig.compileCmd,
        files: [
          memoryFile(''),
          collector('stdout'),
          collector('stderr'),
        ],
        copyIn: {
          [this.languageConfig.sourceFilename]: memoryFile(this.submission.code),
        },
        copyOutCached: [ this.languageConfig.compiledFilename ],
      })
      const [ compiledResult ] = await this.client.runCommand([ command ])
      if (!compiledResult) {
        this.result.judge = JudgeStatus.SystemError
        this.logger.error(
          `Submission ${this.submission.sid} failed on compilation: `
          + 'sandbox returned no result',
        )
        return
      }

      if (compiledResult.status !== SandboxStatus.Accepted) {
        this.result.judge = JudgeStatus.CompileError
        this.result.error = compiledResult.files?.stderr ?? ''
        this.logger.debug(
          `Submission ${this.submission.sid} ended with compile error: ${
            this.result.error}`,
        )
        return
      }

      const fileId = compiledResult.fileIds?.[this.languageConfig.compiledFilename]
      if (!fileId) {
        this.result.judge = JudgeStatus.SystemError
        this.logger.error(
          `Submission ${this.submission.sid} failed on compilation: `
          + 'no compiled file',
        )
        return
      }

      this.compiledFile = preparedFile(fileId)
      this.logger.debug(`Submission ${this.submission.sid} compiled`)
    } catch (error) {
      this.result.judge = JudgeStatus.SystemError
      this.logger.error(
        `Submission ${this.submission.sid} failed on compilation:`,
        error,
      )
    }
  }

  private getRunResult (
    result: SandboxResult,
    timeLimit: number,
    memoryLimit: number,
  ): Pick<JudgerTestcaseResult, 'time' | 'memory'> {
    return {
      time: Math.floor(Math.min(result.time, timeLimit) / 1_000_000),
      memory: Math.floor(Math.min(result.memory, memoryLimit) / 1024),
    }
  }

  async runTestcaseTraditional (
    testcase: JudgerTestcase,
  ): Promise<JudgerTestcaseResult> {
    this.logger.debug(`Running testcase: '${testcase.uuid}'`)
    const { timeLimit, memoryLimit } = this.getLimits()
    const command = createSandboxCmd({
      args: this.languageConfig?.runCmd ?? [],
      cpuLimit: timeLimit,
      clockLimit: timeLimit * 2,
      memoryLimit,
      files: [
        testcase.input,
        collector('stdout'),
        collector('stderr'),
      ],
      copyIn: this.getRuntimeDependencies(),
      copyOutCached: [ 'stdout' ],
    })
    const [ runResult ] = await this.client.runCommand([ command ])
    if (!runResult) {
      throw new Error('Sandbox returned no result while running testcase')
    }

    const measured = this.getRunResult(runResult, timeLimit, memoryLimit)
    const outputFileId = runResult.fileIds?.stdout
    if (!outputFileId) {
      throw new Error('Sandbox did not return stdout for the testcase')
    }
    const outputFile = preparedFile(outputFileId)

    let judge: JudgeStatus
    if (runResult.status === SandboxStatus.Accepted) {
      judge = await this.checker.check(
        testcase.input,
        testcase.output,
        outputFile,
      )
    } else {
      judge = judgeStatusFromSandbox(runResult.status)
    }

    this.trackCleanup(this.client.deleteFile(outputFile.fileId))
    this.logger.debug(
      `Testcase '${testcase.uuid}' finished with judge status: ${judge}`,
    )
    return {
      uuid: testcase.uuid,
      ...measured,
      judge,
    }
  }

  async runTestcaseInteraction (
    testcase: JudgerTestcase,
  ): Promise<JudgerTestcaseResult> {
    this.logger.debug(`Running testcase: '${testcase.uuid}'`)
    const interactorFile = this.checker.getCompiledFile()
    if (!interactorFile) {
      throw new Error('Interactor is unavailable')
    }

    const { timeLimit, memoryLimit } = this.getLimits()
    const userCommand = createSandboxCmd({
      args: this.languageConfig?.runCmd ?? [],
      cpuLimit: timeLimit,
      clockLimit: timeLimit * 2,
      memoryLimit,
      files: [
        null,
        null,
        collector('stderr'),
      ],
      copyIn: this.getRuntimeDependencies(),
    })
    const interactorCommand = createSandboxCmd({
      args: [
        './Interactor', 'infile', 'outfile', 'ansfile',
      ],
      files: [
        null,
        null,
        collector('stderr'),
      ],
      copyIn: {
        Interactor: interactorFile,
        infile: testcase.input,
        outfile: memoryFile(''),
        ansfile: testcase.output,
      },
    })

    const runResults = await this.client.runCommand(
      [ userCommand, interactorCommand ],
      [
        {
          in: { index: 0, fd: 1 },
          out: { index: 1, fd: 0 },
        },
        {
          in: { index: 1, fd: 1 },
          out: { index: 0, fd: 0 },
        },
      ],
    )
    const [ userResult, interactorResult ] = runResults
    if (!userResult || !interactorResult) {
      throw new Error('Sandbox returned incomplete interactive results')
    }

    let judge: JudgeStatus
    if (userResult.status !== SandboxStatus.Accepted) {
      judge = judgeStatusFromSandbox(userResult.status)
    } else if (interactorResult.status === SandboxStatus.Accepted) {
      judge = JudgeStatus.Accepted
    } else if (interactorResult.status === SandboxStatus.NonzeroExitStatus) {
      if (interactorResult.exitStatus === 1) {
        judge = JudgeStatus.WrongAnswer
      } else if (interactorResult.exitStatus === 2) {
        judge = JudgeStatus.PresentationError
      } else if (interactorResult.exitStatus === 3) {
        judge = JudgeStatus.SystemError
        this.logger.error('Interactor reported _fail')
      } else {
        judge = JudgeStatus.SystemError
      }
    } else {
      judge = JudgeStatus.SystemError
    }

    if (judge === JudgeStatus.SystemError) {
      this.logger.error(
        `Interactor execution failed with status: ${interactorResult.status}, `
        + `exit code: ${interactorResult.exitStatus}`,
      )
    }

    this.logger.debug(
      `Testcase '${testcase.uuid}' finished with judge status: ${judge}`,
    )
    return {
      uuid: testcase.uuid,
      ...this.getRunResult(userResult, timeLimit, memoryLimit),
      judge,
    }
  }

  async runTestcase (
    testcase: JudgerTestcase,
  ): Promise<JudgerTestcaseResult> {
    if (this.submission.type === problemType.Interaction) {
      return await this.runTestcaseInteraction(testcase)
    }
    return await this.runTestcaseTraditional(testcase)
  }

  async cleanup (): Promise<void> {
    this.logger.debug(`Submission ${this.submission.sid} cleanup started`)
    if (this.compiledFile) {
      this.trackCleanup(this.client.deleteFile(this.compiledFile.fileId))
    }

    await Promise.allSettled([ ...this.cleanupTasks ])
    this.cleanupTasks.clear()
    this.logger.debug(`Submission ${this.submission.sid} cleanup completed`)
  }

  async run (): Promise<void> {
    if (this.result.judge !== JudgeStatus.Pending) {
      this.logger.warn(
        `Submission ${this.submission.sid} result already set: ${this.result.judge}`,
      )
      return
    }
    this.logger.debug(`Submission ${this.submission.sid} start judging`)

    if (!this.languageConfig) {
      this.result.judge = JudgeStatus.SystemError
      return
    }

    if (this.languageConfig.needCompile) {
      await this.compile()
      if (this.result.judge !== JudgeStatus.Pending) {
        return
      }
      if (!this.compiledFile) {
        this.result.judge = JudgeStatus.SystemError
        this.logger.error(
          `Submission ${this.submission.sid} failed on compilation: `
          + 'no compiled file',
        )
        return
      }
    }

    if (this.submission.testcases.length === 0) {
      this.result.judge = JudgeStatus.SystemError
      this.logger.error(
        `Submission ${this.submission.sid} failed on judging: no testcases`,
      )
      return
    }

    try {
      await this.checker.compile()
    } catch (error) {
      this.result.judge = JudgeStatus.SystemError
      this.logger.error(
        `Submission ${this.submission.sid} failed on checker compilation:`,
        error,
      )
      return
    }

    let skipped = false
    for (const testcase of this.submission.testcases) {
      let testcaseResult: JudgerTestcaseResult
      if (skipped) {
        testcaseResult = {
          uuid: testcase.uuid,
          time: 0,
          memory: 0,
          judge: JudgeStatus.Skipped,
        }
      } else {
        try {
          testcaseResult = await this.runTestcase(testcase)
        } catch (error) {
          testcaseResult = {
            uuid: testcase.uuid,
            time: 0,
            memory: 0,
            judge: JudgeStatus.SystemError,
          }
          this.logger.error(
            `Submission ${this.submission.sid} failed on testing `
            + `'${testcase.uuid}':`,
            error,
          )
        }
      }
      this.result.testcases.push(testcaseResult)

      if (SKIP_STATUS.has(testcaseResult.judge)) {
        skipped = true
      }
    }

    if (this.result.testcases.length === 0) {
      this.result.judge = JudgeStatus.SystemError
      this.logger.error(
        `Submission ${this.submission.sid} failed on judging: no testcase results`,
      )
      return
    }

    this.result.time = Math.max(
      ...this.result.testcases.map(testcase => testcase.time),
    )
    this.result.memory = Math.max(
      ...this.result.testcases.map(testcase => testcase.memory),
    )

    if (
      this.result.testcases.every(testcase => testcase.judge === JudgeStatus.Accepted)
    ) {
      this.result.judge = JudgeStatus.Accepted
      return
    }

    for (const status of JUDGE_STATUS_PRIORITY) {
      if (this.result.testcases.some(testcase => testcase.judge === status)) {
        this.result.judge = status
        return
      }
    }

    this.result.judge = JudgeStatus.SystemError
    this.logger.error(
      `Submission ${this.submission.sid} failed on final check: no status found`,
    )
  }

  async getResult (): Promise<JudgerResult> {
    if (this.result.judge === JudgeStatus.Pending) {
      try {
        await this.run()
      } catch (error) {
        this.result.judge = JudgeStatus.SystemError
        this.logger.error(
          `Submission ${this.submission.sid} failed on judging:`,
          error,
        )
      }

      try {
        await this.cleanup()
      } catch (error) {
        this.logger.error(
          `Submission ${this.submission.sid} failed on cleanup:`,
          error,
        )
      }
    }

    this.logger.debug(`Submission ${this.submission.sid} result:`, this.result)
    return this.result
  }
}
