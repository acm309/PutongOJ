import { JudgeStatus, Language, problemType } from '@putong-oj/shared'
import test from 'ava'
import { Judger } from '../src/modules/judger/judge/judger.ts'
import { createClient, integrationTest } from './helpers.ts'

const testcases = [
  {
    uuid: '82960c11-e8c7-48b5-9cff-d62973570f1e',
    input: { content: '114514\n' },
    output: { content: '\n' },
  },
  {
    uuid: 'f66dc244-bf6e-4924-ba17-d5bfae11459c',
    input: { content: '1919810\n' },
    output: { content: '\n' },
  },
]

const interactorCode = `
#include "testlib.h"
#include <iostream>
using namespace std;
int main(int argc, char** argv) {
  registerInteraction(argc, argv);
  int n = inf.readInt();
  cout.flush();
  int left = 50;
  bool found = false;
  while (left > 0 && !found) {
    left--;
    int a = ouf.readInt(1, 1000000000);
    if (a < n)
      cout << 0 << endl;
    else if (a > n)
      cout << 2 << endl;
    else
      cout << 1 << endl, found = true;
    cout.flush();
  }
  if (!found) quitf(_wa, "couldn't guess the number with 50 questions");
  quitf(_ok, "guessed the number with %d questions!", 50 - left);
}
`

const client = createClient()

test.after.always(async () => {
  await client.close()
})

async function judgeInteraction (
  code: string,
  additionCode = interactorCode,
) {
  const judger = new Judger(client, {
    sid: 1,
    timeLimit: 1000,
    memoryLimit: 32768,
    testcases,
    language: Language.Python,
    code,
    type: problemType.Interaction,
    additionCode,
  })
  return await judger.getResult()
}

integrationTest('accepts an interactive submission', async (t) => {
  const result = await judgeInteraction(`
from sys import stdin, stdout

l, r = 1, 1000000000
while l <= r:
    mid = (l + r) // 2
    print(mid)
    stdout.flush()
    res = int(stdin.readline())
    if res == 0:
        l = mid + 1
    elif res == 2:
        r = mid - 1
    else:
        break
`)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('rejects an interactive wrong answer', async (t) => {
  const result = await judgeInteraction(`
from sys import stdout

print(-1)
stdout.flush()
`)
  t.is(result.judge, JudgeStatus.WrongAnswer)
})

integrationTest('reports interactive runtime errors', async (t) => {
  const result = await judgeInteraction('0/0\n')
  t.is(result.judge, JudgeStatus.RuntimeError)
})

integrationTest('reports a bad interactor as a system error', async (t) => {
  const result = await judgeInteraction(`
from sys import stdin, stdout

l, r = 1, 1000000000
while l <= r:
    mid = (l + r) // 2
    print(mid)
    stdout.flush()
    res = int(stdin.readline())
    if res == 0:
        l = mid + 1
    elif res == 2:
        r = mid - 1
    else:
        break
`, interactorCode.replace('quitf(_ok, ', 'return -1; //'))
  t.is(result.judge, JudgeStatus.SystemError)
})
