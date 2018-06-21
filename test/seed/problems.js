const config = require('../../config')

// 1005: reversed
const problems = {
  size: 5,
  data: [
    {
      title: 'The Depressed Week',
      description: "<p><img src=\"/uploads/upload_d91192da37591bf9a1697a5901a07f38\">HXW, vice leader of learning department of LiangXin college's Student Union, is very busy every day and always forgets the date.</p><p><br></p><p>The day which HXW can find that if Monday was the 1st, 11th or 21st day of that month, he always plays LOL failed in that week. Therefore, he called such week \"The Depressed Week\".</p><p><br></p><p>But now HXW only remembers the date of his first Depressed Week because of the age-related memory loss, and he wants to know the date of the N-th Depressed Week. Can you help him?</p><p><br></p>",
      input: "There are multiple test cases. The first line of input is an integer T indicating the number of test cases. For each test case:<br />The only line contains four integers Y, M, D and N (1 =‹ N =‹ 10^9) indicating the date (Y: year, M: month, D: day) of the Monday of the first Depressed Week and the HXW's query N.<br />The Monday of the first Depressed Week is between 1st Jan, 1753 and 31st Dec, 9999 (inclusive).<br />",
      output: 'For each case, print the date of the Monday of the N-th Depressed Week.',
      in: '2\r\n2016 4 11 9\r\n2016 4 11 8',
      out: '2018 1 1\r\n2017 12 11',
      tags: ['level1']
    },
    {
      title: 'Ruby And Array',
      description: "Recently, Ruby has got a problem which makes him unpleased — without his permission, somebody has been touching his sorted by non-decreasing array a of length n and possibly swapped some elements of the array.<br /><br />Ruby doesn't want to call the police until he understands whether he could have accidentally changed the array by himself. He considers that he could have accidentally changed array a, only if array a can be sorted in no more than one operation of swapping elements (not necessarily adjacent). That is, Ruby could have accidentally swapped some two elements.<br /><br />Help Ruby, determine whether he could have accidentally changed the array a, sorted by non-decreasing, himself.<br />",
      input: "<p>\tThere're multiple groups of&nbsp;test data. Each group contains two lines.</p><p>\tThe first line contains a single integer n (2 ≤ n ≤ 10,000) — the size of array a. The next line contains n positive integers, separated by single spaces and not exceeding 1,000,000,000, — array a.</p>Note: that the elements of the array are not necessarily distinct numbers.<br />Note:<br />In the first sample the array has already been sorted, so to sort it, we need 0 swap operations, that is not more than 1. Thus, the answer is \"YES\".<br /><br />In the second sample we can sort the array if we swap elements 1 and 3, so we need 1 swap operation to sort the array. Thus, the answer is \"YES\".<br /><br />In the third sample we can't sort the array in more than one swap operation, so the answer is \"NO\".<br />",
      output: 'In a single line print "YES" (without the quotes) if the Little Elephant could have accidentally changed the array himself, and "NO" (without the quotes) otherwise.',
      in: '2\r\n1 2\r\n3\r\n3 2 1\r\n4\r\n4 3 2 1',
      out: 'YES\r\nYES\r\nNO',
      tags: ['level1']
    },
    {
      title: 'Sapphire and Robot',
      description: "Sapphire has a funny robot on a 2D plane. Initially it is located in (0, 0). Sapphire can code a command to it. The command is represented by string s. Each character of s is one move operation. There are four move operations at all:<br /><br />1. 'U': go up, (x, y)  →  (x, y+1);<br />2. 'D': go down, (x, y)  →  (x, y-1);<br />3. 'L': go left, (x, y)  →  (x-1, y);<br />4. 'R': go right, (x, y)  →  (x+1, y).<br /><br />The robot will do the operations in s from left to right, and repeat it infinite times. Help Sapphire to determine whether after some steps the robot will located in (a, b) or not.<br /><div>\t<br /></div>",
      input: "<p>\tThere're multiple groups of test data. Each group contains 2 lines.&nbsp;The first line contains two integers a and b, ( - 109 ≤ a, b ≤ 109). The second line contains a string s (1 ≤ |s| ≤ 100, s only contains characters 'U', 'D', 'L', 'R') — the command.</p><p>\tNote:</p><p>\tIn the first and second test case, command string is \"RU\", so the robot will go right, then go up, then right, and then up and so on.<br />The locations of its moves are (0, 0)  →  (1, 0)  →  (1, 1)  →  (2, 1)  →  (2, 2)  →  ...<br />So it can reach (2, 2) but not (1, 2).<br />\t<div>\t\t<br />\t</div></p>",
      output: 'Print "Yes" if the robot will be located at (a, b), and "No" otherwise.<br /><div>\t<br /></div>',
      in: '2 2\r\nRU\r\n1 2\r\nRU\r\n-1 1000000000\r\nLRRLU\r\n0 0\r\nD',
      out: 'Yes\r\nNo\r\nYes\r\nYes\r\n',
      tags: ['level2']
    },
    {
      title: '简单题',
      description: '<p>\r\n\t这次真的没骗你 —— 这道超级简单的题目没有任何输入。\r\n</p>\r\n<p>\r\n\t你只需要在一行中输出事实：“This is a simple problem.”就可以了。\r\n</p>',
      input: '',
      output: '',
      in: '',
      out: '',
      tags: ['level2']
    },
    {
      title: '跟奥巴马一起画方块',
      description: '美国总统奥巴马不仅呼吁所有人都学习编程，甚至以身作则编写代码，成为美国历史上首位编写计算机代码的总统。2014年底，为庆祝“计算机科学教育周”正式启动，奥巴马编写了很简单的计算机代码：在屏幕上画一个正方形。现在你也跟他一起画吧！',
      input: '输入在一行中给出正方形边长N（3&lt;=N&lt;=21）和组成正方形边的某种字符C，间隔一个空格。',
      output: '输出由给定字符C画出的正方形。但是注意到行间距比列间距大，所以为了让结果看上去更像正方形，我们输出的行数实际上是列数的50%（四舍五入取整）。',
      in: '10 a',
      out: 'aaaaaaaaaa\r\naaaaaaaaaa\r\naaaaaaaaaa\r\naaaaaaaaaa\r\naaaaaaaaaa\r\n\r\n',
      status: config.status.Reserve
    }
  ]
}

module.exports = problems
