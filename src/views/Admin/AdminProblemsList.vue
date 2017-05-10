<template lang="html">
  <div>
    <oj-pagination
      class="is-pulled-left"
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
    <table class="table">
      <thead>
        <tr>
          <th>Pid</th>
          <th>Title</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="problem in problemsList">
          <td>{{ problem.pid }}</td>
          <td><router-link
              :to="{name: 'problem', params: {pid: problem.pid}}"
            >{{ problem.title }}</router-link></td>
          <td><a
              class="hint--right"
              aria-label="Click to change status"
              @click="changeStatus(problem)"
            >{{ problem.status | statusPretty }}</a></td>
          <td><a>Edit</a></td>
          <td><a
            @click="del(problem)"
          >Delete</a></td>
        </tr>
      </tbody>
    </table>
    <oj-pagination
      class="is-pulled-left"
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
  </div>
</template>

<script>

import Pagination from '../../components/Pagination.vue'

export default {
  props: ['page', 'limit'],
  components: {
    'oj-pagination': Pagination
  },
  created () {
    this.refresh()
  },
  methods: {
    refresh () {
      this.$store.dispatch('fetchProblemsList', {
        page: this.page,
        limit: this.limit
      })
    },
    pageClick (page) {
      this.$router.push({
        name: 'admin_problems_list',
        query: {
          limit: this.limit,
          page
        }
      })
      this.$store.dispatch('fetchProblemsList', {
        page,
        limit: this.limit
      })
    },
    del (problem) {
      this.$store.dispatch('deleteProblem', problem)
    },
    changeStatus (problem) {
      if (problem.status === this.status.Available) {
        problem.status = this.status.Reserve
      } else {
        problem.status = this.status.Available
      }
      this.$store.dispatch('updateProblem', problem)
    }
  },
  computed: {
    status () {
      return this.$store.getters.status
    },
    problemsList () {
      return this.$store.getters.problemsList
    },
    pagination () {
      return this.$store.getters.problemsPagination
    }
  }
}
</script>

<style lang="css">
</style>
