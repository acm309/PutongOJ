<template lang="html">
  <div class="content">
    <oj-problemcontent :problem="problem">
    </oj-problemcontent>
    <hr>
    <a
      class="button is-primary"
      :disabled="!self"
    >Submit</a>
    <a class="button"> Statistics </a>
    <p v-if="!self">
      <a @click="login">Log in</a> to submit
    </p>
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
    }).then(() => {
      document.title = `Problem ${this.problem.pid} -- ${this.problem.title}`
    })
  },
  computed: {
    problem () {
      return this.$store.getters.problem
    },
    self () {
      return this.$store.getters.self
    }
  },
  methods: {
    login () {
      this.$store.commit('showLoginModal')
    }
  }
}
</script>

<style lang="css">
</style>
