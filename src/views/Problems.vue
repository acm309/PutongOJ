<template lang="html">
  <div>
    <table class="table">
      <tr
        v-for="problem in problemsList"
        :key="problem.pid"
        is="oj-problemitem"
        :problem="problem"
      >
      </tr>
    </table>
  </div>
</template>

<script>

import ProblemItem from '../components/ProblemItem.vue'

export default {
  components: {
    'oj-problemitem': ProblemItem
  },
  created () {
    this.$store.dispatch('fetchProblemsList')
  },
  computed: {
    problemsList () {
      return this.$store.getters.problemsList
    }
  }
}
</script>

<style lang="css">
</style>
