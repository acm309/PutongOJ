import type { JudgerResult, Language } from '@putong-oj/shared'
import { JudgeStatus, problemType } from '@putong-oj/shared'
import test from 'ava'
import { Judger } from '../src/judge/judger.ts'
import { createClient, integrationTest } from './helpers.ts'

const testcases = [
  {
    uuid: 'fdc3a68e-21d2-4ec1-baf6-36611f45f685',
    input: { content: '1 1\n1 2\n2 1\n' },
    output: { content: '2\n3\n3\n' },
  },
  {
    uuid: 'f34bbc92-1461-422e-8f61-26e6790a36a8',
    input: { content: '114 514\n1919 810\n' },
    output: { content: '628\n2729\n' },
  },
  {
    uuid: 'ae005ba0-8c29-446d-82c0-219fef264fba',
    input: { content: '-2147483648 2147483647\n0 0\n' },
    output: { content: '-1\n0\n' },
  },
]

const client = createClient()

test.after.always(async () => {
  await client.close()
})

async function judgeCode (
  code: string,
  language: Language,
): Promise<JudgerResult> {
  const judger = new Judger(client, {
    sid: 1,
    timeLimit: 1000,
    memoryLimit: 32768,
    testcases,
    language,
    code,
    type: problemType.Traditional,
    additionCode: '',
  })
  return await judger.getResult()
}

integrationTest('accepts C submissions', async (t) => {
  const result = await judgeCode(`
#include <stdio.h>
int main()
{
    int a,b;
    while(scanf("%d %d",&a, &b) != EOF)
        printf("%d\\n",a+b);
    return 0;
}
`, 1)
  t.is(result.judge, JudgeStatus.Accepted)
  t.true(result.testcases.every(testcase => testcase.judge === JudgeStatus.Accepted))
})

integrationTest('accepts C++11 submissions', async (t) => {
  const result = await judgeCode(`
#include <iostream>
using namespace std;
int main()
{
    int a,b;
    while(cin >> a >> b)
        cout << a+b << endl;
}
`, 2)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('accepts C++17 submissions', async (t) => {
  const result = await judgeCode(`
#include <iostream>
int main()
{
    int a,b;
    while(std::cin >> a >> b)
        std::cout << a+b << '\\n';
}
`, 5)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('accepts Java submissions', async (t) => {
  const result = await judgeCode(`
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        while (in.hasNextInt()) {
            int a = in.nextInt();
            int b = in.nextInt();
            System.out.println(a + b);
        }
    }
}
`, 3)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('accepts Python submissions', async (t) => {
  const result = await judgeCode(`
import sys
for line in sys.stdin:
    a, b = map(int, line.split())
    print(a + b)
`, 4)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('accepts PyPy submissions', async (t) => {
  const result = await judgeCode(`
while True:
    try:
        a, b = map(int, input().split())
    except EOFError:
        break
    print(a + b)
`, 6)
  t.is(result.judge, JudgeStatus.Accepted)
})

integrationTest('reports time limit exceeded and skips remaining cases', async (t) => {
  const result = await judgeCode('while True:\n\tpass\n', 4)
  t.is(result.judge, JudgeStatus.TimeLimitExceeded)
  t.is(result.testcases[0]?.judge, JudgeStatus.TimeLimitExceeded)
  t.true(
    result.testcases.slice(1)
      .every(testcase => testcase.judge === JudgeStatus.Skipped),
  )
})

integrationTest('reports runtime errors', async (t) => {
  const result = await judgeCode('print(1/0)\n', 4)
  t.is(result.judge, JudgeStatus.RuntimeError)
  t.true(result.testcases.every(testcase => testcase.judge === JudgeStatus.RuntimeError))
})

integrationTest('reports compile errors', async (t) => {
  const result = await judgeCode('int main() { return 0; }\n', 4)
  t.is(result.judge, JudgeStatus.CompileError)
  t.is(result.testcases.length, 0)
  t.true(result.error.includes('SyntaxError'))
})

integrationTest('reports wrong answers', async (t) => {
  const result = await judgeCode('print(42)\n', 4)
  t.is(result.judge, JudgeStatus.WrongAnswer)
})
