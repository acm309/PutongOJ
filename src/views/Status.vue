<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>SID</th>
          <th>PID</th>
          <th>Username</th>
          <th>Judge</th>
          <th>Time</th>
          <th>Memory</th>
          <th>Language</th>
          <th>Length</th>
          <th>Submit Time</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>SID</th>
          <th>PID</th>
          <th>Username</th>
          <th>Judge</th>
          <th>Time</th>
          <th>Memory</th>
          <th>Language</th>
          <th>Length</th>
          <th>Submit Time</th>
        </tr>
      </tfoot>
      <tbody>
        <tr
          v-for="solution in solutions"
          :key="solution.sid"
          is="oj-solutionitem"
          :solution="solution"
        >

        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import SolutionItem from '../components/SolutionItem.vue'

export default {
  components: {
    'oj-solutionitem': SolutionItem
  },
  props: [ 'page', 'limit' ],
  computed: {
    solutions () {
      return this.$store.getters.solutionsList
    }
  },
  created () {
    this.$store.dispatch('fetchSolutionsList', {
      page: this.page,
      limit: this.limit
    })
  }
}
</script>

<style lang="css">
</style>
