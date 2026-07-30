const solutionSeeds = [
  {
    status: 'WRONG_ANSWER',
    language: 2,
    memoryUsedKb: 1720,
    problemId: 1001,
    similarity: 0,
    similarSubmissionIndex: 0,
    timeUsedMs: 1,
    username: 'legacysubmitter',
    createdAt: 1529560370205,
    testcases: [ {
      status: 'WRONG_ANSWER',
      memoryUsedKb: 1720,
      timeUsedMs: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    sourceCode: `import java.util.Scanner;
        public class Main {
            public static void main(String[] args){
                Scanner s = new Scanner(System.in);
                while (true){
                    int a = s.nextInt();
                    int b = s.nextInt();
                    System.out.println((a + b));
                }
            }
        }
      `,
  }, {
    status: 'ACCEPTED',
    language: 2,
    memoryUsedKb: 1720,
    problemId: 1001,
    similarity: 0,
    similarSubmissionIndex: 0,
    timeUsedMs: 1,
    username: 'primaryuser',
    createdAt: 1529560370305,
    testcases: [ {
      status: 'ACCEPTED',
      memoryUsedKb: 1720,
      timeUsedMs: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    sourceCode: `#include <iostream>
          using namespace std;
          int main()
          {
              int a,b;
              while(cin>>a>>b){
                  cout<<a+b<<endl;
              }

              return 0;
          }
      `,
  }, {
    status: 'RUNTIME_ERROR',
    language: 3,
    memoryUsedKb: 24836,
    problemId: 1001,
    similarity: 0,
    similarSubmissionIndex: 0,
    timeUsedMs: 170,
    username: 'legacysubmitter',
    createdAt: 1529560370405,
    testcases: [ {
      status: 'RUNTIME_ERROR',
      memoryUsedKb: 24836,
      timeUsedMs: 170,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    sourceCode: `import java.util.Scanner;
        public class Main {
            public static void main(String[] args){
                Scanner s = new Scanner(System.in);
                while (true){
                    int a = s.nextInt();
                    int b = s.nextInt();
                    System.out.println((a + b));
                }
            }
        }
      `,
  }, {
    status: 'ACCEPTED',
    language: 2,
    memoryUsedKb: 1720,
    problemId: 1001,
    similarity: 100,
    similarSubmissionIndex: 2,
    timeUsedMs: 1,
    username: 'legacysubmitter',
    createdAt: 1529560371205,
    testcases: [ {
      status: 'ACCEPTED',
      memoryUsedKb: 1720,
      timeUsedMs: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    sourceCode: `#include <iostream>
          using namespace std;
          int main()
          {
              int a,b;
              while(cin>>a>>b){
                  cout<<a+b<<endl;
              }

              return 0;
          }
      `,
  },
]

export { solutionSeeds }
