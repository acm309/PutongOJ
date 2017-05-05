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
          <th>#</th> <th>PID</th> <th>Title</th> <th>Submit</th> <th>Ratio</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="problem in problemsList">
          <td></td>
          <td> {{ problem.pid }} </td>
          <td> <router-link
              :to="{name: 'problem', params: {pid: problem.pid}}"
            > {{ problem.title }} </router-link></td>
          <td>
            <a @click="submit(problem)">
              <i class="fa fa-paper-plane fa-lg" aria-hidden="true"></i>
            </a>
          </td>
          <td> {{ ratio(problem) }} ({{ problem.solve }} / {{ problem.submit }}) </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>#</th> <th>PID</th> <th>Title</th> <th>Submit</th> <th>Ratio</th>
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
    <oj-submitcodemodal
      v-if="active"
      @close="active = false"
      @submit="submitCode">
      {{ solutionTitle }}
    </oj-submitcodemodal>
  </div>
</template>

<script>

import ProblemItem from '../components/ProblemItem.vue'
import Pagination from '../components/Pagination.vue'
import SubmitCodeModal from '../components/SubmitCodeModal.vue'

export default {
  props: [ 'page', 'limit' ],
  data () {
    return {
      field: 'pid',
      query: '',
      active: false,
      submitProblem: {}
    }
  },
  components: {
    'oj-pagination': Pagination,
    'oj-problemitem': ProblemItem,
    'oj-submitcodemodal': SubmitCodeModal
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
    },
    solutionTitle () {
      return `${this.submitProblem.pid} -- ${this.submitProblem.title}`
    }
  },
  methods: {
    pageClick (page) {
      const query = {
        limit: this.limit,
        page,
        field: this.field,
        query: this.query
      }
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
    },
    ratio(problem) {
      if (problem.submit === 0) {
        return '0.00%'
      } else {
        return `${(problem.solve * 100 / problem.submit).toFixed(2)}%`
      }
    },
    submit (problem) {
      this.submitProblem = problem
      this.active = true
    },
    submitCode (payload) {
      this.$store.dispatch('submitSolution', Object.assign(payload, {
        pid: this.submitProblem.pid
      }))
      .then(() => {
        this.$router.push({
          name: 'status',
          query: {
            uid: this.$store.getters.self.uid
          }
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
