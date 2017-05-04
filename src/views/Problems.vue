<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>PID</th>
          <th>Title</th>
          <th>Submit</th>
          <th>Ratio</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="problem in problemsList"
          :key="problem.pid"
          is="oj-problemitem"
          :problem="problem"
        >
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>#</th>
          <th>PID</th>
          <th>Title</th>
          <th>Submit</th>
          <th>Ratio</th>
        </tr>
      </tfoot>
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
    document.title = 'Problems'
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
