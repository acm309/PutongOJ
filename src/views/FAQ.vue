<script setup>
</script>

<template>
  <div class="faq-wrap">
    <h1>常见问题 / FAQ</h1>
    <hr>
    <h3>
      问：各个评测状态的含义是什么？<br />
      Q: What are the meanings of the various judge statuses?
    </h3>
    <p>
      答：下面是评测状态的含义表：<br />
      A: Here is a table of the judge status meanings:
    </p>
    <table>
      <thead>
        <th>状态 / Status</th>
        <th>含义 / Meaning</th>
      </thead>
      <tbody>
        <tr>
          <td>
            <p class="info pd">
              Pending
            </p>
          </td>
          <td>
            评测机繁忙，暂时无法评测你的提交，通常只需等待一分钟左右，你的提交就会被评测。<br />
            The judge is busy and cannot judge your submission temporarily. Usually, you just need to wait for about a
            minute, and your submission will be judged.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info rj">
              Running &amp; Judge
            </p>
          </td>
          <td>
            你的代码正在运行，并且正在被评测。<br />
            Your code is running and being judged.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info ac">
              <b>AC</b><br />
              Accepted
            </p>
          </td>
          <td>
            你的程序是正确的！<br />
            OK! Your program is correct!.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info pe">
              <b>PE</b><br />
              Presentation Error
            </p>
          </td>
          <td>
            你的输出格式与评测的输出格式不完全一致，尽管你的答案可能是正确的。请检查你的输出格式、空格、空行等是否符合题目输出规范。<br />
            Your output format is not exactly the same as the judge's output, although your answer to the problem is likely
            correct. Check your output for spaces, blank lines,etc against the problem output specification.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info wa">
              <b>WA</b><br />
              Wrong Answer
            </p>
          </td>
          <td>
            你的程序没有得到正确的结果。<br />
            Your program did not produce the correct result.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info tle">
              <b>TLE</b><br />
              Time Limit Exceeded
            </p>
          </td>
          <td>
            你的程序运行时间超过了评测允许的时间。<br />
            Your program ran longer than the judge's time limit.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info mle">
              <b>MLE</b><br />
              Memory Limit Exceeded
            </p>
          </td>
          <td>
            你的程序使用的内存超过了评测允许的内存。<br />
            Your program used more memory than the judge's memory limit.
          </td>
        </tr>
        <tr>
          <td>
            <p class="info ole">
              <b>OLE</b><br />
              Output Limit Exceeded
            </p>
          </td>
          <td>
            你的程序输出了太多的信息。这通常是由于你的程序进入了一个无限循环。<br />
            Your program tried to write too much information. This usually occurs if it goes into an infinite loop.
          </td>
        </tr>
      </tbody>
    </table>
    <h3>
      问：评测机的编译器是什么，以及编译器的选项是什么？<br />
      Q: What is the compiler the judge is using and what are the compiler options?
    </h3>
    <p>
      答：评测机使用以下编译器和编译选项来编译和运行用户提交的代码。以下是每种语言的详细信息：<br />
      A: The judge uses the following compilers and compiler options to compile and run user-submitted code. Here are
      the details for each language:
    </p>
    <table>
      <thead>
        <th>语言 / Language</th>
        <th>版本 / Version</th>
        <th>选项 / Options</th>
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
          <td>openjdk & javac 11.0.23</td>
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
    <h3>
      问：我的程序能知道它是在评测机上运行吗？<br />
      Q: Can my program know it is running on the judge?
    </h3>
    <p>
      答：是的，你可以通过检查环境变量 <code>ONLINE_JUDGE</code> 来判断你的程序是否在评测机上运行。<br />
      A: Yes, you can check the environment variable <code>ONLINE_JUDGE</code> to determine if your program is running
      on the judge.
    </p>
    <h3>
      问：为什么我得到了一个编译错误？<br />
      Q: Why did I get a Compile Error? It's well done!
    </h3>
    <p>
      答：有一些 GNU 和 MS-VC++ 之间的差异，例如：<br />
      A: There are some differences between GNU and MS-VC++, such as:
    </p>
    <ol>
      <li><code>main</code> must be declared as <code>int</code>, <code>void main</code> will end up with a Compile Error.</li>
      <li><code>i</code> is out of definition after block <code>for (int i=0; ...) {...}</code></li>
      <li><code>itoa</code> is not an ANSI function.</li>
      <li><code>__int64</code> of VC is not ANSI, but you can use <code>long long</code> for 64-bit integer.</li>
    </ol>
    <h3>
      问：平台的浏览器兼容性如何？<br />
      Q: How about the browser compatibility?
    </h3>
    <p>
      答：不推荐使用 <b>IE</b>！但是 <b>Chrome</b>（50 及以上），<b>Firefox</b>（50 及以上），<b>Edge</b> 都是推荐的。<br />
      A: <b>IE</b> is not recommended! But <b>Chrome</b> (50 and above), <b>Firefox</b> (50 and above),
      <b>Edge</b> are all recommended.
    </p>
  </div>
</template>

<style lang="stylus" scoped>
h1, hr
  margin-bottom: 10px
h3
  margin-top: 20px
  margin-bottom: 10px
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
    td:nth-child(1)
      width: 180px
    td:nth-child(2)
      padding: 5px
      padding-left: 20px
.info
  border-radius: 4px
  text-align: center
  padding: 2px
code
  margin: 0 3px
ol
  margin-top: 10px
  margin-bottom: 10px
  padding-left: 20px
  padding-right: 20px
  li
    list-style-type: disc
</style>
