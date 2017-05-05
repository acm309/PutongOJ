<template lang="html">
  <div>
    <oj-pagination
      class="is-pulled-left"
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
    <div class="field has-addons is-pulled-right">
      <p class="control">
        <span class="select">
          <select v-model="field">
            <option value="pid">PID</option>
            <option value="title">title</option>
          </select>
        </span>
      </p>
      <p class="control">
        <input class="input" type="text" placeholder="Content" v-model="query"  @keyup.enter="search">
      </p>
      <p class="control">
        <a class="button is-primary" @click="search">
          Search
        </a>
      </p>
    </div>
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
      class="is-pulled-left"
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
    <div class="field has-addons is-pulled-right">
      <p class="control">
        <span class="select">
          <select v-model="field">
            <option value="pid">PID</option>
            <option value="title">title</option>
          </select>
        </span>
      </p>
      <p class="control">
        <input class="input" type="text" placeholder="Content" v-model="query"  @keyup.enter="search">
      </p>
      <p class="control">
        <a class="button is-primary" @click="search">
          Search
        </a>
      </p>
    </div>
  </div>
</template>

<script>

import ProblemItem from '../components/ProblemItem.vue'
import Pagination from '../components/Pagination.vue'

export default {
  props: [ 'page', 'limit' ],
  data () {
    return {
      field: 'pid',
      query: ''
    }
  },
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
      let query = {limit: this.limit, page}
      query = Object.assign(query, {
        field: this.field,
        query: this.query
      })
      this.$router.push({
        name: 'problems',
        query
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchProblemsList', query)
    },
    search () {
      this.pageClick(1) // 复用
    }
  }
}
</script>

<style lang="css">
</style>
