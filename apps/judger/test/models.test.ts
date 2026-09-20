import { JudgerResultSchema, JudgerTaskSchema, JudgerTestcaseSchema,
  JudgeStatus,
  Language,
  problemType } from '@putong-oj/shared'
import test from 'ava'

test('parses local, prepared and memory testcase files', (t) => {
  t.deepEqual(
    JudgerTestcaseSchema.parse({
      uuid: 'local',
      input: { src: 'input' },
      output: { src: 'output' },
    }),
    {
      uuid: 'local',
      input: { src: 'input' },
      output: { src: 'output' },
    },
  )
  t.deepEqual(
    JudgerTestcaseSchema.parse({
      uuid: 'prepared',
      input: { fileId: 'input' },
      output: { fileId: 'output' },
    }),
    {
      uuid: 'prepared',
      input: { fileId: 'input' },
      output: { fileId: 'output' },
    },
  )
  t.deepEqual(
    JudgerTestcaseSchema.parse({
      uuid: 'memory',
      input: { content: 'input' },
      output: { content: 'output' },
    }),
    {
      uuid: 'memory',
      input: { content: 'input' },
      output: { content: 'output' },
    },
  )
})

test('rejects invalid testcase files', (t) => {
  t.throws(() => {
    JudgerTestcaseSchema.parse({
      uuid: 'invalid',
      input: { invalid: 'input' },
      output: { invalid: 'output' },
    })
  })
})

test('applies Python-compatible task defaults', (t) => {
  const submission = JudgerTaskSchema.parse({
    sid: 1,
    timeLimit: 1000,
    memoryLimit: 32768,
    testcases: [],
    language: Language.Python,
    code: 'print("Hello")',
  })

  t.is(submission.type, problemType.Traditional)
  t.is(submission.additionCode, '')
})

test('applies Python-compatible result defaults', (t) => {
  t.deepEqual(JudgerResultSchema.parse({ sid: 1 }), {
    sid: 1,
    time: 0,
    memory: 0,
    testcases: [],
    judge: JudgeStatus.Pending,
    error: '',
  })
})
