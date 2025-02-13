<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isZH = $computed(() => locale.value === 'zh-CN')

import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'

import 'highlight.js/styles/atom-one-light.css'

highlight.registerLanguage('c', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

function prettyCode(code, language) {
  return highlight.highlight(`${code}`, {
    language: language,
  }).value
}

import { Typography, Title, Paragraph, Tabs, TabPane } from 'view-ui-plus'

const exampleCode = {
  C: `#include <stdio.h>

int main() {
#ifdef ONLINE_JUDGE
    printf("Running on the judge\\n");
#else
    printf("Not running on the judge\\n");
#endif
    return 0;
}`,
  Java: `public class Main {
    public static void main(String[] args) {
        if (System.getProperty("ONLINE_JUDGE") != null) {
            System.out.println("Running on the judge");
        } else {
            System.out.println("Not running on the judge");
        }
    }
}`,
  Python: `import os

if os.getenv("ONLINE_JUDGE") == "1":
    print("Running on the judge")
else:
    print("Not running on the judge")`
}
</script>

<template>
  <div class="faq-wrap">
    <div class="faq-header">
      <span class="faq-subtitle">FAQ</span>
      <span class="faq-title">{{ isZH ? '常见问题' : 'Frequently Asked Questions' }}</span>
    </div>
    <Typography>
      <Title :level="4" v-if="isZH">问：各个评测状态的含义是什么？</Title>
      <Title :level="4" v-else>Q: What are the meanings of the various judge statuses?</Title>
      <Paragraph v-if="isZH">下面是评测状态的含义表：</Paragraph>
      <Paragraph v-else>Here is a table of the meanings of the judge statuses:</Paragraph>
      <table>
        <thead>
          <th class="info">{{ isZH ? '状态' : 'Status' }}</th>
          <th>{{ isZH ? '含义' : 'Meaning' }}</th>
        </thead>
        <tbody>
          <tr>
            <td class="info pd"><span v-if="isZH"><b>等待</b><br /></span>Pending</td>
            <td v-if="isZH">评测机繁忙，暂时无法评测你的提交，通常只需等待一分钟左右，你的提交就会被评测。</td>
            <td v-else>
              The judge is busy and cannot judge your submission temporarily. Usually, you just need to wait for about a
              minute, and your submission will be judged.
            </td>
          </tr>
          <tr>
            <td class="info rj"><span v-if="isZH"><b>运行 & 评测</b><br /></span>Running &amp; Judge</td>
            <td v-if="isZH">你的代码正在运行，并且正在被评测。</td>
            <td v-else>Your code is running and being judged.</td>
          </tr>
          <tr>
            <td class="info ce"><b>{{ isZH ? '编译错误' : 'CE' }}</b><br />Compile Error</td>
            <td v-if="isZH">你的代码无法通过编译，通常是因为你的代码中有语法错误。</td>
            <td v-else>Your code cannot be compiled, usually because there are syntax errors in your code.</td>
          </tr>
          <tr>
            <td class="info ac"><b>{{ isZH ? '通过' : 'AC' }}</b><br />Accepted</td>
            <td v-if="isZH">你的程序是正确的！</td>
            <td v-else>OK! Your program is correct!.</td>
          </tr>
          <tr>
            <td class="info pe"><b>{{ isZH ? '格式错误' : 'PE' }}</b><br />Presentation Error</td>
            <td v-if="isZH">你的输出格式与评测的输出格式不完全一致，尽管你的答案可能是正确的。请检查你的输出格式、空格、空行等是否符合题目输出规范。</td>
            <td v-else>
              Your output format is not exactly the same as the judge's output, although your answer to the problem is
              likely correct. Check your output for spaces, blank lines,etc against the problem output specification.
            </td>
          </tr>
          <tr>
            <td class="info wa"><b>{{ isZH ? '答案错误' : 'WA' }}</b><br />Wrong Answer</td>
            <td v-if="isZH">你的程序没有得到正确的结果。</td>
            <td v-else>Your program did not produce the correct result.</td>
          </tr>
          <tr>
            <td class="info re"><b>{{ isZH ? '运行错误' : 'RE' }}</b><br />Runtime Error</td>
            <td v-if="isZH">你的程序在运行时发生了错误，通常是由于数组越界、除零等原因。</td>
            <td v-else>
              Your program encountered an error during execution, usually due to reasons such as array out of bounds,
              division by zero, etc.
            </td>
          </tr>
          <tr>
            <td class="info tle"><b>{{ isZH ? '时间超限' : 'TLE' }}</b><br />Time Limit Exceeded</td>
            <td v-if="isZH">你的程序运行时间超过了评测允许的时间。</td>
            <td v-else>Your program ran longer than the judge's time limit.</td>
          </tr>
          <tr>
            <td class="info mle"><b>{{ isZH ? '内存超限' : 'MLE' }}</b><br />Memory Limit Exceeded</td>
            <td v-if="isZH">你的程序使用的内存超过了评测允许的内存。</td>
            <td v-else>Your program used more memory than the judge's memory limit.</td>
          </tr>
          <tr>
            <td class="info ole"><b>{{ isZH ? '输出超限' : 'OLE' }}</b><br />Output Limit Exceeded</td>
            <td v-if="isZH">你的程序输出了太多的信息。这通常是由于你的程序进入了一个无限循环。</td>
            <td v-else>
              Your program tried to write too much information. This usually occurs if it goes into an infinite loop.
            </td>
          </tr>
          <tr>
            <td class="info se"><b>{{ isZH ? '系统错误' : 'SE' }}</b><br />System Error</td>
            <td v-if="isZH">评测机发生了错误，这可能不是你的问题，请坐和放宽。</td>
            <td v-else>The judge encountered an error, which may not be your fault. Please relax.</td>
          </tr>
        </tbody>
      </table>
      <Title :level="4" v-if="isZH">问：评测机的编译 / 运行环境是什么？</Title>
      <Title :level="4" v-else>Q: What is the compiler / runtime environment of the judge?</Title>
      <Paragraph v-if="isZH">评测机的编译器 / 运行时环境如下：</Paragraph>
      <Paragraph v-else>The compiler / runtime environment of the judge is as follows:</Paragraph>
      <div class="faq-table-container">
        <table class="faq-table">
          <thead>
            <th>{{ isZH ? '语言' : 'Language' }}</th>
            <th>{{ isZH ? '编译器 / 运行时' : 'Compiler / Runtime' }}</th>
            <th>{{ isZH ? '编译选项 / 运行选项' : 'Compiler Options / Runtime Options' }}</th>
          </thead>
          <tbody>
            <tr>
              <td><b>C</b></td>
              <td>gcc (Debian 8.3.0-6) 8.3.0</td>
              <td><code>gcc Main.c -o Main -Wall -lm --static -std=c11 -DONLINE_JUDGE -w</code></td>
            </tr>
            <tr>
              <td><b>C++</b></td>
              <td>g++ (Debian 8.3.0-6) 8.3.0</td>
              <td><code>g++ Main.cpp -o Main -std=c++11 -Wall -lm --static -DONLINE_JUDGE -w</code></td>
            </tr>
            <tr>
              <td><b>Java</b></td>
              <td>openjdk &amp; javac 11.0.23</td>
              <td>
                <code>javac -J-Xms128M -J-Xmx512M Main.java</code><br />
                <code>java -Xms128M -Xms512M -DONLINE_JUDGE=true Main</code>
              </td>
            </tr>
            <tr>
              <td><b>Python 3</b></td>
              <td>Python 3.7.3</td>
              <td><code>env ONLINE_JUDGE=1 python Main.py</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <Title :level="4" v-if="isZH">问：我的程序能知道它是在评测机上运行吗？</Title>
      <Title :level="4" v-else>Q: Can my program know if it is running on the judge?</Title>
      <Paragraph v-if="isZH">
        是的，你可以通过不同的方式来判断你的程序是否在评测机上运行。C 和 C++ 通过宏定义，Java 通过系统属性，Python
        通过环境变量来得知程序是否在评测机上运行。下面给出了一些示例：
      </Paragraph>
      <Paragraph v-else>
        Yes, you can determine whether your program is running on the judge in different ways. C and C++ use macro
        definitions, Java uses system properties, and Python uses environment variables to determine whether the program
        is running on the judge. Here are some examples:
      </Paragraph>
      <Tabs value="example-code" :animated="false">
        <TabPane label="C / C++" name="c">
          <pre><code v-html="prettyCode(exampleCode['C'], 'C')" /></pre>
        </TabPane>
        <TabPane label="Java" name="java">
          <pre><code v-html="prettyCode(exampleCode['Java'], 'Java')" /></pre>
        </TabPane>
        <TabPane label="Python 3" name="python">
          <pre><code v-html="prettyCode(exampleCode['Python'], 'Python')" /></pre>
        </TabPane>
      </Tabs>
      <Title :level="4" v-if="isZH">问：为什么我得到了编译错误，但是在我的本地却可以编译通过？</Title>
      <Title :level="4" v-else>Q: Why did I get a compile error, but it compiled successfully on my local machine?
      </Title>
      <Paragraph v-if="isZH">或许是因为 GNU 和 MS-VC++ 之间存在一些差异，例如：</Paragraph>
      <Paragraph v-else>It may be due to some differences between GNU and MS-VC++, such as:</Paragraph>
      <Paragraph v-if="isZH">
        <ul>
          <li><code>main</code> 必须声明为 <code>int</code>，<code>void main</code> 会导致编译错误。</li>
          <li><code>i</code> 在 <code>for (int i=0; ...) {...}</code> 之后就超出了定义范围。</li>
          <li><code>itoa</code> 不是 ANSI 函数。</li>
          <li>VC 的 <code>__int64</code> 不是 ANSI，但你可以使用 <code>long long</code> 来表示 64 位整数。</li>
        </ul>
      </Paragraph>
      <Paragraph v-else>
        <ul>
          <li><code>main</code> must be declared as <code>int</code>, <code>void main</code> will end up with a Compile
            Error.</li>
          <li><code>i</code> is out of definition after block <code>for (int i=0; ...) {...}</code></li>
          <li><code>itoa</code> is not an ANSI function.</li>
          <li><code>__int64</code> of VC is not ANSI, but you can use <code>long long</code> for 64-bit integer.</li>
        </ul>
      </Paragraph>
    </Typography>
  </div>
</template>

<style lang="stylus" scoped>
.faq-wrap
  width: 100%
  max-width: 1024px
  padding-top: 30px
@media screen and (max-width: 1024px)
  .faq-wrap
    padding-top: 20px

.faq-header
  margin-bottom: 20px
  color hsl(0, 0%, 20%)
  .faq-subtitle
    font-size 12px
    font-family verdana, arial, sans-serif
  .faq-title
    display: block
    font-size 28px
    font-weight bold

.faq-table-container
  overflow-x auto
  width 100%
.faq-table
  width 100%
  min-width 768px
  margin 0

@import '../styles/common'

table
  width: 100%
  border-collapse: collapse
  border-spacing: 0
  margin-bottom: 20px
  th
    line-height: 40px
    height: 40px
    border-bottom: 2px solid #dbdbdb
    font-size: 16px
  tr
    border-bottom: 1px solid #dbdbdb
    line-height 25px
  th
    padding 0 5px
  td
    padding 5px
  .info
    width 180px
    text-align center
ul, li
  list-style-type circle !important
</style>
