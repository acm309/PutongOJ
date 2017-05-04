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
  props: [ 'page', 'limit' ],
  components: {
    'oj-problemitem': ProblemItem
  },
  created () {
    this.$store.dispatch('fetchProblemsList', {
      page: this.page,
      limit: this.limit
    })
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
