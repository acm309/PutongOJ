<template lang="html">
  <div v-if="solution">
    <h1>{{ result[solution.judge] }}</h1>
    <p>
      <span>Problem:
        <router-link :to="{name: 'problemInfo', params: {pid: solution.pid}}">
          {{ solution.pid }}
        </router-link>
      </span>
      <span>Memory: {{ solution.memory }} KB</span>
      <span>Runtime: {{ solution.time }} MS</span>
      <span>Author:
        <router-link :to="{name: 'userInfo', params: {uid: solution.uid}}">
          {{ solution.uid }}
        </router-link>
      </span>
    </p>
    <hr>
    <h2>Testcases</h2>
    <table>
      <tr>
        <th>Uuid</th>
        <th>Time/ms</th>
        <th>Memory/kb</th>
        <th>Result</th>
      </tr>
      <template v-for="(item, index) in solution.testcases">
        <tr>
          <td>{{ item.uuid.slice(0, 8) }}
            <a :href="testcaseUrl(item, 'in')" target="_blank">TestIn</a>
            <a :href="testcaseUrl(item, 'out')" target="_blank">TestOut</a>
          </td>
          <td>{{ item.time }}</td>
          <td>{{ item.memory }}</td>
          <td :class="color[item.judge]">{{ result[item.judge] }}</td>
        </tr>
      </template>
    </table>
    <!-- <hr> -->
    <pre class="error" v-if="solution.error"><code>{{ solution.error }}</code></pre>
    <br>
    <Button type="ghost" shape="circle" icon="document" v-clipboard:copy="solution.code" v-clipboard:success="onCopy">
      Click to copy code
    </Button>
    <pre><code v-html="prettyCode(solution.code)"></code></pre>
    <div v-if="isAdmin && solution.sim">
      <hr>
      Similarity: {{ solution.sim }}%</br>
      From: {{ solution.simSolution.sid }} by
      <router-link :to="{name: 'userInfo', params: {uid: solution.simSolution.uid}}">
        {{ solution.simSolution.uid }}
      </router-link>
      <pre><code v-html="prettyCode(solution.simSolution.code)"></code></pre>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import constant from '@/util/constant'
import 'highlight.js/styles/github.css'
// import highlight from 'highlight.js'
// https://github.com/isagalaev/highlight.js/issues/1284
import highlight from 'highlight.js/lib/highlight'
import cpp from 'highlight.js/lib/languages/cpp'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/atom-one-light.css'
import { testcaseUrl } from '@/util/helper'

highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)
highlight.registerLanguage('python', python)

export default {
  data: () => ({
    result: constant.result,
    language: constant.language,
    color: constant.color
  }),
  computed: {
    ...mapGetters('solution', [ 'solution' ]),
    ...mapGetters('session', [ 'isAdmin' ])
  },
  created () {
    this.$store.dispatch('solution/findOne', this.$route.params).then(() => {
      this.changeDomTitle({ title: `Solution ${this.solution.pid}` })
    })
  },
  methods: {
    ...mapActions(['changeDomTitle']),
    prettyCode (code) {
      return highlight.highlight(this.language[this.solution.language], `${this.solution.code}`).value
    },
    onCopy () {
      this.$Message.success('Copied!')
    },
    testcaseUrl ({ uuid }, type) {
      return testcaseUrl(this.solution.pid, uuid, type)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../styles/common'

h1
  margin-bottom: 6px
p
  margin-bottom: 4px
span
  margin-right: 20px
hr
  margin-bottom: 10px
pre
  border: 1px solid #e040fb
  border-radius: 4px
  padding: 10px
  &.error
    background-color: #FFF9C4
</style>
