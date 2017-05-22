<template lang="html">
  <div class="content">
    <h1>FAQ</h1>
    <hr>
    <h3>Q: What is the meaning of the judge's reply XXXXX?</h3>
    A:Here is a table of the judge's replies and their meaning:
    <table>
      <tbody>
        <tr>
          <td><span class="tag is-warning">Pending</span></td>
          <td>The judge is so busy that it can't judge your submit at the moment, usually you just need to wait a minute and your submit will be judged.</td>
        </tr>
        <tr>
          <td><span class="tag is-warning">Running &amp; Judge</span></td>
          <td>Your code is running and being judging by our Online Judge.</td>
        </tr>
        <tr>
          <td><span class="tag is-danger">Accepted</span></td>
          <td>OK! Your program is correct!.</td>
        </tr>
        <tr>
          <td><span class="tag is-info">Presentation Error</span></td>
          <td>Your output format is not exactly the same as the judge's output, although your answer to the problem is correct. Check your output for spaces, blank lines,etc against the problem output specification.</td>
        </tr>
        <tr>
          <td><span class="tag is-info">Wrong Answer</span></td>
          <td> Correct solution not reached for the inputs. The inputs and outputs that we use to test the programs are not public (it is recomendable to get accustomed to a true contest dynamic).</td>
        </tr>
        <tr>
          <td><span class="tag is-info">Time Limit Exceeded</span></td>
          <td>Your program tried to run during too much time.</td>
        </tr>
        <tr>
          <td><span class="tag is-info">Memory Limit Exceeded</span></td>
          <td>Your program tried to use more memory than the judge default settings.</td>
        </tr>
        <tr>
          <td><span class="tag is-info">Output Limit Exceeded</span></td>
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
            <td>gcc -o Main -static -w -lm -std=c99 -O2 -DONLINE_JUDGE</td>
          </tr>
          <tr>
            <td>C++</td>
            <td>g++ (Ubuntu 4.8.4-2ubuntu1~14.04.1) 4.8.4</td>
            <td>g++ -o Main -static -w -lm -std++=c99 -O2 -DONLINE_JUDGE</td>
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
  created () {
    document.title = 'FAQ'
  }
}
</script>

<style lang="css">
</style>
