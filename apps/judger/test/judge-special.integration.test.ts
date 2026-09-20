import { JudgeStatus, Language, problemType } from '@putong-oj/shared'
import test from 'ava'
import { Judger } from '../src/judge/judger.ts'
import { createClient, integrationTest } from './helpers.ts'

const checker = `
#include "testlib.h"
#include <string>

using namespace std;

const string YES = "YES";
const string NO = "NO";

int main(int argc, char *argv[]) {
    setName("%s", (YES + " or " + NO + " (case insensitive)").c_str());
    registerTestlibCmd(argc, argv);

    std::string ja = upperCase(ans.readWord());
    std::string pa = upperCase(ouf.readWord());

    if (ja != YES && ja != NO)
        quitf(_fail, "%s or %s expected in answer, but %s found", YES.c_str(), NO.c_str(), compress(ja).c_str());

    if (pa != YES && pa != NO)
        quitf(_pe, "%s or %s expected, but %s found", YES.c_str(), NO.c_str(), compress(pa).c_str());

    if (ja != pa)
        quitf(_wa, "expected %s, found %s", compress(ja).c_str(), compress(pa).c_str());

    quitf(_ok, "answer is %s", ja.c_str());
}
`

const client = createClient()

test.after.always(async () => {
  await client.close()
})

async function judgeSpecial (code: string, additionCode = checker) {
  const judger = new Judger(client, {
    sid: 1,
    timeLimit: 1000,
    memoryLimit: 32768,
    testcases: [
      {
        uuid: 'bab33078-ea14-46ff-93bc-3a5a6c19fda6',
        input: { content: '1 1 2\n' },
        output: { content: 'YES\n' },
      },
    ],
    language: Language.Python,
    code,
    type: problemType.SpecialJudge,
    additionCode,
  })
  return await judger.getResult()
}

integrationTest('accepts a special judge submission', async (t) => {
  const result = await judgeSpecial(`
a, b, c = map(int, input().split())
print('YES' if a + b == c else 'NO')
`)
  t.is(result.judge, JudgeStatus.Accepted)
  t.true(result.testcases.every(testcase => testcase.judge === JudgeStatus.Accepted))
})

integrationTest('rejects a special judge wrong answer', async (t) => {
  const result = await judgeSpecial('print(\'NO\')\n')
  t.is(result.judge, JudgeStatus.WrongAnswer)
  t.true(result.testcases.every(testcase => testcase.judge === JudgeStatus.WrongAnswer))
})

integrationTest('reports a checker compile error as a system error', async (t) => {
  const result = await judgeSpecial('import this\n', String.raw`¯\_(ツ)_/¯`)
  t.is(result.judge, JudgeStatus.SystemError)
})
