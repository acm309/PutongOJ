<template lang="html">
  <div class="content">
    <oj-problemcontent :problem="problem">
    </oj-problemcontent>
    <hr>
    <a class="button is-primary">Submit</a> <a class="button"> Statistics </a>
  </div>
</template>

<script>

import ProblemContent from '../components/ProblemContent.vue'

export default {
  components: {
    'oj-problemcontent': ProblemContent
  },
  props: [ 'pid' ],
  created () {
    this.$store.dispatch('fetchProblem', {
      pid: this.pid
    })
  },
  computed: {
    problem () {
      return this.$store.getters.problem
    }
  }
}
</script>

<style lang="css">
</style>
