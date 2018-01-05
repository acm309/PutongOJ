<template lang="html">
  <div>
    <h1>Compile Error</h1>
    <p>
      <span>Memory: 1000 kb</span>
      <span>Runtime: 100 ms</span>
      <span>Author: Admin</span>
    </p>
    <hr>
    <pre class="error"><code>{{ error }}</code></pre>
    <pre><code v-html="code"></code></pre>
  </div>
</template>

<script>
import 'highlight.js/styles/github.css'
import highlight from 'highlight.js'

export default {
  data: () => ({
    error: `Errors:
  1  http://eslint.org/docs/rules/eqeqeq

You may use special comments to disable some warnings.
Use // eslint-disable-next-line to ignore the next line.
Use /* eslint-disable */ to ignore all warnings in a file.


WAIT  Compiling...                                                                                                                                                               6:35:43 PM

95% emitting

WARNING  Compiled with 2 warnings                                                                                                                                                6:35:44 PM


✘  http://eslint.org/docs/rules/eqeqeq  Expected '!==' and instead saw '!='
src/views/Problem/Problem.vue:27:14
      if (to != from) this.current = this.$route.name`,
    code: highlight.highlight('c++', `#include <iostream>
#include <string>
#include "json.hpp"

// for convenience
using json = nlohmann::json;
using namespace std;

json get_meta_json() {
    FILE *ce_msg = fopen("meta.json", "r");
    std::string message = "";
    char tmp[1024];
    while (fgets(tmp, sizeof(tmp), ce_msg)) {
        message += tmp;
    }

    return json::parse(message);
}

int main () {
    json j;
    for (int i = 0; i < 5; i++) {
        json obj = json::object();
        obj["uuid"] = "a864ede1-a264-4585-93a7-8612d1c5b338";
        obj["time"] = 0;
        obj["memory"] = 752;
        obj["result"] = "WRONG ANSWER";
        if (i & 1) obj["error"] = "no such file";
        j.push_back(obj);
    }
    string s = j.dump(2);
    cout << s << endl;
    cout << j[0]["uuid"] << endl;

    json meta = get_meta_json();
    for (auto& testcase : meta["testcases"]) {
        cout << testcase << endl;
    }

    return 0;
}
`).value
  })
}
</script>

<style lang="stylus" scoped>
span
  margin-right: 20px
pre
  border: 1px solid #e040fb
  border-radius: 4px
  padding: 10px
  &.error
    background-color: #FFF9C4
</style>
