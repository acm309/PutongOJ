const config = require('../../config')

module.exports = {
  size: 2,
  data: [
    {
      pid: 1000,
      uid: 'admin',
      code: `#include <iostream>
        using namespace std;
        int main() {
          return 0;
        }
      `,
      language: 1 // TODO: constant
    },
    {
      pid: 1001,
      uid: 'primaryuser',
      code: `#include <iostream>
        using namespace std;
        int main() {
          return 0;
        }
      `,
      sim: 100,
      sim_s_id: 1000,
      language: 1 // TODO: constant
    }
  ]
}
