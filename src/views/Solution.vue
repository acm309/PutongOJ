<template lang="html">
  <div class="solution-wrap">
    <h1>{{ result[solution.judge] }}</h1>
    <p>
      <span>Memory: {{ solution.memory }} KB</span>
      <span>Runtime: {{ solution.time }} MS</span>
      <span>Author: {{ solution.uid }}</span>
    </p>
    <hr>
    <pre class="error" v-if="solution.error"><code>{{ solution.error }}</code></pre>
    <br>
    <Button type="ghost" shape="circle" icon="document" v-clipboard:copy="solution.code" v-clipboard:success="onCopy">
      Click to copy code
    </Button>
    <pre><code v-html="prettyCode(solution.code)"></code></pre>
    <div v-if="isAdmin && solution.sim">
      <hr>
      Similarity: {{ solution.sim }}</br>
      From: {{ solution.simSolution.sid }}% by {{ solution.simSolution.uid }}
      <pre><code v-html="prettyCode(solution.simSolution.code)"></code></pre>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import constant from '@/util/constant'
import 'highlight.js/styles/github.css'
import highlight from 'highlight.js'
// https://github.com/isagalaev/highlight.js/issues/1284

export default {
  data: () => ({
    result: constant.result,
    language: constant.language
  }),
  computed: {
    ...mapGetters('solution', [ 'solution' ]),
    ...mapGetters('session', [ 'isAdmin' ])
  },
  created () {
    this.$store.dispatch('solution/findOne', this.$route.params)
  },
  methods: {
    prettyCode (code) {
      return highlight.highlight(this.language[this.solution.language], `${this.solution.code}`).value
    },
    onCopy () {
      this.$Message.success('Copied!')
    }
  }
}
</script>

<style lang="stylus" scoped>
.solution-wrap
  h1
    margin-bottom: 6px
  p
    margin-bottom: 4px
  span
    margin-right: 20px
  pre
    border: 1px solid #e040fb
    border-radius: 4px
    padding: 10px
    &.error
      background-color: #FFF9C4
</style>
