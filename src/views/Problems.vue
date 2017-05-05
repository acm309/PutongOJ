<template lang="html">
  <div>
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
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
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
  </div>
</template>

<script>

import ProblemItem from '../components/ProblemItem.vue'
import Pagination from '../components/Pagination.vue'

export default {
  props: [ 'page', 'limit' ],
  components: {
    'oj-pagination': Pagination,
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
    },
    pagination () {
      return this.$store.getters.problemsPagination
    }
  },
  methods: {
    pageClick (page) {
      this.$router.push({
        name: 'problems',
        query: {
          page
        }
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchProblemsList', {
        page: page,
        limit: this.limit
      })
    }
  }
}
</script>

<style lang="css">
</style>
