import { Language, problemType } from '@putong-oj/shared'
import test from 'ava'
import { buildJudgerTask } from '../src/modules/judger/services/submission.ts'

test('builds a judger task from database records', (t) => {
  const submission = buildJudgerTask(
    {
      sid: 42,
      pid: 1000,
      language: Language.Python,
      code: 'print("Hello")',
    },
    {
      pid: 1000,
      time: 1000,
      memory: 32768,
      type: problemType.SpecialJudge,
      code: 'checker code',
    },
    [ { uuid: 'testcase-1' } ],
    '/app/data',
  )

  t.deepEqual(submission, {
    sid: 42,
    timeLimit: 1000,
    memoryLimit: 32768,
    testcases: [
      {
        uuid: 'testcase-1',
        input: { src: '/app/data/1000/testcase-1.in' },
        output: { src: '/app/data/1000/testcase-1.out' },
      },
    ],
    language: Language.Python,
    code: 'print("Hello")',
    type: problemType.SpecialJudge,
    additionCode: 'checker code',
  })
})
