<template>
  <div class="faq-wrap">
    <h1>FAQ</h1>
    <hr>
    <h3>Q: What is the meaning of the judge's reply XXXXX?</h3>
    A:Here is a table of the judge's replies and their meaning:
    <table>
      <tbody>
        <tr>
          <td><p class="info yellow">Pending</p></td>
          <td>The judge is so busy that it can't judge your submit at the moment, usually you just need to wait a minute and your submit will be judged.</td>
        </tr>
        <tr>
          <td><p class="info yellow">Running &amp; Judge</p></td>
          <td>Your code is running and being judging by our Online Judge.</td>
        </tr>
        <tr>
          <td><p class="info red">Accepted</p></td>
          <td>OK! Your program is correct!.</td>
        </tr>
        <tr>
          <td><p class="info blue">Presentation Error</p></td>
          <td>Your output format is not exactly the same as the judge's output, although your answer to the problem is correct. Check your output for spaces, blank lines,etc against the problem output specification.</td>
        </tr>
        <tr>
          <td><p class="info blue">Wrong Answer</p></td>
          <td> Correct solution not reached for the inputs. The inputs and outputs that we use to test the programs are not public (it is recomendable to get accustomed to a true contest dynamic).</td>
        </tr>
        <tr>
          <td><p class="info blue">Time Limit Exceeded</p></td>
          <td>Your program tried to run during too much time.</td>
        </tr>
        <tr>
          <td><p class="info blue">Memory Limit Exceeded</p></td>
          <td>Your program tried to use more memory than the judge default settings.</td>
        </tr>
        <tr>
          <td><p class="info blue">Output Limit Exceeded</p></td>
          <td>Your program tried to write too much information. This usually occurs if it goes into an infinite loop.</td>
        </tr>
      </tbody>
    </table>
    <h3>Q:What is the compiler the judge is using and what are the compiler options?</h3>
    <p>A:We are using <code>GNU GCC/G++</code> for C/C++ compile, and <code>oracle-java-jdk1.8</code> for Java. The compile options are:</p>
      <table>
        <thead>
          <th>Language</th>
          <th>Version</th>
          <th>Options</th>
        </thead>
        <tbody>
          <tr>
            <td>C</td>
            <td>gcc (Ubuntu 4.8.4-2ubuntu1~14.04.1) 4.8.4</td>
            <td>gcc -o Main -w -lm -std=c99 -O2 -DONLINE_JUDGE</td>
          </tr>
          <tr>
            <td>C++</td>
            <td>g++ (Ubuntu 4.8.4-2ubuntu1~14.04.1) 4.8.4</td>
            <td>g++ -o Main -static -w -lm -O2 -std=c++11 -DONLINE_JUDGE</td>
          </tr>
          <tr>
            <td>Java</td>
            <td>java1.8</td>
            <td>javac Main.java</td>
          </tr>
        </tbody>
      </table>
      <h3>Q:Why did I get a Compile Error? It's well done!</h3>
      <p>A: There are some differences between GNU and MS-VC++, such as:</p>
      <ol>
        <li>main must be declared as int, void main will end up with a Compile Error.</li>
        <li>i is out of definition after block "for(int i=0...){...}"</li>
        <li>itoa is not an ANSI function.</li>
        <li>__int64 of VC is not ANSI, but you can use long long for 64-bit integer.</li>
      </ol>
      <h3>Q: How about the browser compatibility?</h3>
      <p>A: <code>IE</code> is not recommended! But <code>Chrome</code> (50 or above), <code>Firefox</code> (50 or above), <code>Edge</code> are all recommended.</p>
  </div>
</template>
<script>

export default {
}
</script>
<style lang="stylus" scoped>
h1, hr
  margin-bottom: 10px
h3
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
      padding-left: 20px
      line-height: 40px
.info
  color: #fff
  border-radius: 4px
  text-align: center
  padding: 2px
.yellow
  background-color: #ffdd57
.red
  background-color: #ff3860
.blue
  background-color: #3273dc
code
  display: inline-block
  background: #f7f7f7
  font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace
  margin: 0 3px
  padding: 1px 5px
  border-radius: 3px
  color: #666
  border: 1px solid #eee
ol
  margin-bottom: 10px
</style>
