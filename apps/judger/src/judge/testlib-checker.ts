import type { JudgerFile } from '@putong-oj/shared'
import type { SandboxClient } from '../sandbox/client.ts'
import type { PreparedFile } from '../sandbox/types.ts'
import { createHash } from 'node:crypto'
import { JudgeStatus } from '@putong-oj/shared'
import { DEFAULT_CHECKER_CODE, TESTLIB_CODE } from '../assets.ts'
import { createLogger } from '../logger.ts'
import {
  collector,
  createSandboxCmd,
  memoryFile,
  SandboxStatus,
} from '../sandbox/types.ts'
import { judgeStatusFromChecker } from './status.ts'

export class TestlibChecker {
  static readonly SOURCE_FILENAME = 'Checker.cpp'
  static readonly COMPILED_FILENAME = 'Checker'
  static readonly COMPILE_CMD = [
    '/usr/bin/g++-12', 'Checker.cpp', '-o', 'Checker',
    '-std=c++17', '-O2', '-lm', '-w', '-fmax-errors=3', '--static',
  ]

  static readonly RUN_CMD = [
    './Checker', 'infile', 'outfile', 'ansfile',
  ]

  private readonly client: SandboxClient
  private readonly code: string
  private readonly logger = createLogger('judger.checker')
  private compiledFile?: { fileId: string }

  constructor (
    client: SandboxClient,
    code: string = DEFAULT_CHECKER_CODE,
  ) {
    this.client = client
    this.code = code
    this.logger.debug('Testlib checker initialized')
  }

  getCompiledFile (): PreparedFile | undefined {
    return this.compiledFile
  }

  async compile (): Promise<void> {
    if (this.compiledFile) {
      return
    }

    const checkerHash = createHash('sha256').update(this.code).digest('hex')
    const identifier = `checker-${checkerHash}`
    this.compiledFile = await this.client.cache.get(identifier)
    if (this.compiledFile) {
      this.logger.debug('Get compiled checker from cache')
      return
    }

    let testlibFile = await this.client.cache.get('testlib.h')
    if (!testlibFile) {
      testlibFile = await this.client.uploadFile(TESTLIB_CODE, 'testlib.h')
      await this.client.cache.set('testlib.h', testlibFile)
      this.logger.debug('Uploaded Testlib header file')
    }

    const command = createSandboxCmd({
      args: TestlibChecker.COMPILE_CMD,
      files: [
        memoryFile(''),
        collector('stdout'),
        collector('stderr'),
      ],
      copyIn: {
        [TestlibChecker.SOURCE_FILENAME]: memoryFile(this.code),
        'testlib.h': testlibFile,
      },
      copyOutCached: [ TestlibChecker.COMPILED_FILENAME ],
    })
    const [ compiledResult ] = await this.client.runCommand([ command ])
    if (!compiledResult) {
      throw new Error('Sandbox returned no result while compiling checker')
    }
    if (compiledResult.status !== SandboxStatus.Accepted) {
      throw new Error(
        `Failed to compile Testlib checker: \n${compiledResult.files?.stderr ?? ''}`,
      )
    }

    const fileId = compiledResult.fileIds?.[TestlibChecker.COMPILED_FILENAME]
    if (!fileId) {
      throw new Error('Sandbox did not return the compiled Testlib checker')
    }

    this.compiledFile = { fileId }
    await this.client.cache.set(identifier, this.compiledFile)
  }

  async check (
    inputFile: JudgerFile,
    answerFile: JudgerFile,
    outputFile: JudgerFile,
  ): Promise<JudgeStatus> {
    await this.compile()
    if (!this.compiledFile) {
      return JudgeStatus.SystemError
    }

    const command = createSandboxCmd({
      args: TestlibChecker.RUN_CMD,
      files: [
        memoryFile(''),
        collector('stdout'),
        collector('stderr'),
      ],
      copyIn: {
        [TestlibChecker.COMPILED_FILENAME]: this.compiledFile,
        infile: inputFile,
        outfile: outputFile,
        ansfile: answerFile,
      },
    })
    const [ checkerResult ] = await this.client.runCommand([ command ])
    if (!checkerResult) {
      this.logger.error('Sandbox returned no result while running checker')
      return JudgeStatus.SystemError
    }

    const status = judgeStatusFromChecker(checkerResult)
    if (status === JudgeStatus.SystemError && checkerResult.status !== SandboxStatus.Accepted) {
      this.logger.error(
        {
          exitStatus: checkerResult.exitStatus,
          status: checkerResult.status,
        },
        'Checker execution failed',
      )
    }
    return status
  }
}
