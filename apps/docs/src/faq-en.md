# Frequently Asked Questions {#faq}

## Meanings of Various Judge Statuses? {#judge-status}

Here is a table of the meanings of the judge statuses:

| Status | Meaning |
| :--- | :--- |
| **Pending** | The judge is busy and cannot judge your submission temporarily. Usually, you just need to wait for about a minute, and your submission will be judged. |
| **Running & Judge** | Your code is running and being judged. |
| <span style="color: oklch(60.6% 0.25 292.717)">**Compile Error (CE)**</span> | Your code cannot be compiled, usually because there are syntax errors in your code. |
| <span style="color: oklch(63.7% 0.237 25.331)">**Accepted (AC)**</span> | OK! Your program is correct!. |
| <span style="color: oklch(68.1% 0.162 75.834)">**Presentation Error (PE)**</span> | Your output format is not exactly the same as the judge's output, although your answer to the problem is likely correct. Check your output for spaces, blank lines,etc against the problem output specification. |
| <span style="color: oklch(72.3% 0.219 149.579)">**Wrong Answer (WA)**</span> | Your program did not produce the correct result. |
| <span style="color: oklch(72.3% 0.219 149.579)">**Runtime Error (RE)**</span> | Your program encountered an error during execution, usually due to reasons such as array out of bounds, division by zero, etc. |
| <span style="color: oklch(72.3% 0.219 149.579)">**Time Limit Exceeded (TLE)**</span> | Your program ran longer than the judge's time limit. |
| <span style="color: oklch(72.3% 0.219 149.579)">**Memory Limit Exceeded (MLE)**</span> | Your program used more memory than the judge's memory limit. |
| <span style="color: oklch(72.3% 0.219 149.579)">**Output Limit Exceeded (OLE)**</span> | Your program tried to write too much information. This usually occurs if it goes into an infinite loop. |
| <span style="color: oklch(72.3% 0.219 149.579)">**System Error (SE)**</span> | The judge encountered an error, which may not be your fault. Please relax. |

## Compiler / Runtime Environment of the Judge? {#compiler-runtime-environment}

The compiler / runtime environment of the judge is as follows:

| Language | Compiler / Runtime | Compiler Options / Runtime Options |
| :--- | :--- | :--- |
| **C** | gcc 12.2.0 | `gcc Main.c -o Main -std=c11 -O2 -lm -DONLINE_JUDGE -w --static` |
| **C++ 11** | g++ 12.2.0 | `g++ Main.cpp -o Main -std=c++11 -O2 -lm -DONLINE_JUDGE -w --static` |
| **C++ 17** | g++ 12.2.0 | `g++ Main.cpp -o Main -std=c++17 -O2 -lm -DONLINE_JUDGE -w --static` |
| **Java** | openjdk & javac 17.0.14 | `javac Main.java -encoding UTF-8`<br>`java -DONLINE_JUDGE Main` |
| **Python 3** | Python 3.11.2 | `python -m py_compile Main.py`<br>`python Main.py` |
| **PyPy 3** | Python 3.9.16<br>PyPy 7.3.11 | `pypy3 -m py_compile Main.py`<br>`pypy3 Main.py` |

## Can my program know if it is running on the judge? {#detect-judge-environment}

Yes, you can determine whether your program is running on the judge in different ways. C and C++ use macro definitions, Java uses system properties, and Python uses environment variables to determine whether the program is running on the judge. Here are some examples:

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

## Why does my C / C++ code that compiles locally fail to compile on the judge? {#c-cpp-compile-fail}

It may be due to some differences between GNU and MS-VC++, such as:

- `main` must be declared as `int`, `void main` will end up with a Compile Error.
- `i` is out of definition after block `for (int i=0; ...) {...}`
- `itoa` is not an ANSI function.
- `__int64` of VC is not ANSI, but you can use `long long` for 64-bit integer.
