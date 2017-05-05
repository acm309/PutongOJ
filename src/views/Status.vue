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
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
  </div>
</template>

<script>

import SolutionItem from '../components/SolutionItem.vue'
import Pagination from '../components/Pagination.vue'

export default {
  components: {
    'oj-pagination': Pagination,
    'oj-solutionitem': SolutionItem
  },
  props: [ 'page', 'limit' ],
  computed: {
    solutions () {
      return this.$store.getters.solutionsList
    },
    pagination () {
      return this.$store.getters.solutionsPagination
    }
  },
  created () {
    document.title = 'Status'
    this.$store.dispatch('fetchSolutionsList', {
      page: this.page,
      limit: this.limit
    })
  },
  methods: {
    pageClick (page) {
      this.$router.push({
        name: 'status',
        query: {
          page
        }
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchSolutionsList', {
        page: page,
        limit: this.limit
      })
    }
  }
}
</script>

<style lang="css">
</style>
