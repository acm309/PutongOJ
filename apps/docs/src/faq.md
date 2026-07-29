# 常见问题 {#faq}

## 各个评测状态的含义？{#judge-status}

下面是评测状态的含义表：

| 状态 | 含义 |
| :--- | :--- |
| **等待**<br>Pending | 评测机繁忙，暂时无法评测你的提交，通常只需等待一分钟左右，你的提交就会被评测。 |
| **运行 & 评测**<br>Running & Judge | 你的代码正在运行，并且正在被评测。 |
| <span style="color: oklch(60.6% 0.25 292.717)">**编译错误**<br>Compile Error</span> | 你的代码无法通过编译，通常是因为你的代码中有语法错误。 |
| <span style="color: oklch(63.7% 0.237 25.331)">**通过**<br>Accepted</span> | 你的程序是正确的！ |
| <span style="color: oklch(68.1% 0.162 75.834)">**格式错误**<br>Presentation Error</span> | 你的输出格式与评测的输出格式不完全一致，尽管你的答案可能是正确的。请检查你的输出格式、空格、空行等是否符合题目输出规范。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**答案错误**<br>Wrong Answer</span> | 你的程序没有得到正确的结果。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**运行错误**<br>Runtime Error</span> | 你的程序在运行时发生了错误，通常是由于数组越界、除零等原因。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**时间超限**<br>Time Limit Exceeded</span> | 你的程序运行时间超过了评测允许的时间。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**内存超限**<br>Memory Limit Exceeded</span> | 你的程序使用的内存超过了评测允许的内存。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**输出超限**<br>Output Limit Exceeded</span> | 你的程序输出了太多的信息。这通常是由于你的程序进入了一个无限循环。 |
| <span style="color: oklch(72.3% 0.219 149.579)">**系统错误**<br>System Error</span> | 评测机发生了错误，这可能不是你的问题，请坐和放宽。 |

## 评测机的编译 / 运行环境？{#compiler-runtime-environment}

评测机的编译器 / 运行时环境如下：

| 语言 | 编译器 / 运行时 | 编译选项 / 运行选项 |
| :--- | :--- | :--- |
| **C** | gcc 12.2.0 | `gcc Main.c -o Main -std=c11 -O2 -lm -DONLINE_JUDGE -w --static` |
| **C++ 11** | g++ 12.2.0 | `g++ Main.cpp -o Main -std=c++11 -O2 -lm -DONLINE_JUDGE -w --static` |
| **C++ 17** | g++ 12.2.0 | `g++ Main.cpp -o Main -std=c++17 -O2 -lm -DONLINE_JUDGE -w --static` |
| **Java** | openjdk & javac 17.0.14 | `javac Main.java -encoding UTF-8`<br>`java -DONLINE_JUDGE Main` |
| **Python 3** | Python 3.11.2 | `python -m py_compile Main.py`<br>`python Main.py` |
| **PyPy 3** | Python 3.9.16<br>PyPy 7.3.11 | `pypy3 -m py_compile Main.py`<br>`pypy3 Main.py` |

## 我的程序能知道它是在评测机上运行吗？{#detect-judge-environment}

是的，你可以通过不同的方式来判断你的程序是否在评测机上运行。C 和 C++ 通过宏定义，Java 通过系统属性，Python 通过环境变量来得知程序是否在评测机上运行。下面给出了一些示例：

#### C / C++ {#detect-c-cpp}
```c
#include <stdio.h>

int main() {
#ifdef ONLINE_JUDGE
    printf("Running on the judge\n");
#else
    printf("Not running on the judge\n");
#endif
    return 0;
}
```

#### Java {#detect-java}
```java
public class Main {
    public static void main(String[] args) {
        if (System.getProperty("ONLINE_JUDGE") != null) {
            System.out.println("Running on the judge");
        } else {
            System.out.println("Not running on the judge");
        }
    }
}
```

#### Python 3 / PyPy 3 {#detect-python}
```python
import os

if os.getenv("ONLINE_JUDGE") == "1":
    print("Running on the judge")
else:
    print("Not running on the judge")
```

## 为什么我本地能编译通过的 C / C++ 代码在评测机上编译失败了？{#c-cpp-compile-fail}

或许是因为 GNU 和 MS-VC++ 之间存在一些差异，例如：

- `main` 必须声明为 `int`，`void main` 会导致编译错误。
- `i` 在 `for (int i=0; ...) {...}` 之后就超出了定义范围。
- `itoa` 不是 ANSI 函数。
- VC 的 `__int64` 不是 ANSI，但你可以使用 `long long` 来表示 64 位整数。
