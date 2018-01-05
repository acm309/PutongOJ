<template lang="html">
  <div>
    <h1>{{ result[solution.judge] }}</h1>
    <p>
      <span>Memory: {{ solution.memory }} KB</span>
      <span>Runtime: {{ solution.time }} MS</span>
      <span>Author: {{ solution.uid }}</span>
    </p>
    <hr>
    <pre class="error"><code>{{ solution.error }}</code></pre>
    <Button type="ghost" shape="circle" icon="document" v-clipboard:copy="code" v-clipboard:success="onCopy">
      Click to copy code
    </Button>
    <pre><code v-html="solution.code"></code></pre>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import constant from '../util/constant'
import 'highlight.js/styles/github.css'
// import highlight from 'highlight.js'
// https://github.com/isagalaev/highlight.js/issues/1284

export default {
  data: () => ({
    result: constant.result
    // code: highlight.highlight('c++', `${this.solution.code}`).value
  }),
  computed: {
    ...mapGetters('solution', [
      'solution'
    ])
  },
  created () {
    this.$store.dispatch('solution/findOne', this.$route.params)
  },
  methods: {
    onCopy () {
      // TODO 现在复制的代码是 highlight 之后的代码，也就是会有 html 标签的代码
      this.$Message.success('Copied!')
    }
  }
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
