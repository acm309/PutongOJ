import { JudgeStatus } from '@putongoj/shared'
import constants from '../../src/utils/constants'

const { status } = constants

const solutionSeeds = [
  {
    judge: JudgeStatus.WrongAnswer,
    language: 2, // C++
    length: 135,
    memory: 1720,
    mid: -1,
    pid: 1001,
    sim: 0,
    sim_s_id: 0,
    status: status.Available,
    time: 1,
    uid: 'v6u(EYNmK!Ot7xr(O',
    create: 1529560370205,
    testcases: [ {
      judge: JudgeStatus.WrongAnswer,
      memory: 1720,
      time: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    code: `import java.util.Scanner;
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
    judge: JudgeStatus.Accepted,
    language: 2, // C++
    length: 138,
    memory: 1720,
    mid: -1,
    pid: 1001,
    sim: 0,
    sim_s_id: 0,
    status: status.Available,
    time: 1,
    uid: 'primaryuser',
    create: 1529560370305,
    testcases: [ {
      judge: JudgeStatus.Accepted,
      memory: 1720,
      time: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    code: `#include <iostream>
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
    judge: JudgeStatus.RuntimeError,
    language: 3, // Java
    length: 273,
    memory: 24836,
    mid: -1,
    pid: 1001,
    sim: 0,
    sim_s_id: 0,
    status: status.Available,
    time: 170,
    uid: 'v6u(EYNmK!Ot7xr(O',
    create: 1529560370405,
    testcases: [ {
      judge: JudgeStatus.RuntimeError,
      memory: 24836,
      time: 170,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    code: `import java.util.Scanner;
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
    judge: JudgeStatus.Accepted,
    language: 2, // C++
    length: 138,
    memory: 1720,
    mid: -1,
    pid: 1001,
    sim: 100,
    sim_s_id: 2,
    status: status.Available,
    time: 1,
    uid: 'v6u(EYNmK!Ot7xr(O',
    create: 1529560371205,
    testcases: [ {
      judge: JudgeStatus.Accepted,
      memory: 1720,
      time: 1,
      uuid: 'e35af796-ac32-496b-998b-3ed56809fbc2',
    } ],
    code: `#include <iostream>
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
