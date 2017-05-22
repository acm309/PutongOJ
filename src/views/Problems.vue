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
        <tr v-for="problem in problemsList">
          <td>
            <i
              class="fa fa-check"
              aria-hidden="true"
              v-if="solved.indexOf(problem.pid) !== -1">
            </i>
          </td>
          <td> {{ problem.pid }} </td>
          <td>
            <router-link :to="{name: 'problem', params: {pid: problem.pid}}">
              {{ problem.title }}
            </router-link>
            <oj-reserve :status="problem.status"></oj-reserve>
          </td>
          <td>
            <a @click="submit(problem)">
              <i class="fa fa-paper-plane-o" aria-hidden="true"></i>
            </a>
          </td>
          <td> {{ ratio(problem) }}
            (<router-link
              :to="{name: 'status', query: {judge: judgeCode.Accepted, pid: problem.pid}}"
            >{{ problem.solve }}</router-link> /
            <router-link
              :to="{name: 'status', query: {pid: problem.pid}}"
            >{{ problem.submit }}</router-link>)
          </td>
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
    <transition
      name="custom-classes-transition"
      enter-active-class="animated fadeInUp"
      leave-active-class="animated fadeOutDown"
    >
      <oj-submitcodemodal
        v-if="active"
        @close="active = false"
        :loading="loading"
        @submit="submitCode">
        {{ solutionTitle }}
      </oj-submitcodemodal>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Pagination from '../components/Pagination.vue'
import SubmitCodeModal from '../components/SubmitCodeModal.vue'
import ReservedSpan from '../components/ReservedSpan.vue'

export default {
  props: [ 'page', 'limit' ],
  data () {
    return {
      field: 'pid',
      query: '',
      active: false,
      submitProblem: {},
      loading: false
    }
  },
  components: {
    'oj-pagination': Pagination,
    'oj-submitcodemodal': SubmitCodeModal,
    'oj-reserve': ReservedSpan
  },
  created () {
    document.title = 'Problems'
    this.$store.dispatch('fetchProblemsList', {
      page: this.page,
      limit: this.limit
    })
  },
  computed: {
    solutionTitle () {
      // 代码提交框里的标题
      return `${this.submitProblem.pid} -- ${this.submitProblem.title}`
    },
    ...mapGetters({
      logined: 'logined',
      problemsList: 'problemsList',
      pagination: 'problemsPagination',
      judgeCode: 'judgeCode',
      solved: 'problemsSolved',
      self: 'self'
    })
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
    ratio (problem) {
      if (problem.submit === 0) {
        return '0.00%'
      } else {
        return `${(problem.solve * 100 / problem.submit).toFixed(2)}%`
      }
    },
    submit (problem) {
      if (this.logined) {
        this.submitProblem = problem
        this.active = true // 打开代码提交框
      } else {
        // 先登录
        this.$store.commit('showLoginModal')
      }
    },
    submitCode (payload) {
      this.loading = true
      this.$store.dispatch('submitSolution', {
        ...payload,
        pid: this.submitProblem.pid
      })
      .then(() => {
        this.loading = false
        this.$router.push({
          name: 'status',
          query: {
            uid: this.self.uid
          }
        })
      })
      .catch((err) => {
        this.loading = false
        this.$store.dispatch('addMessage', {
          body: err.message,
          type: 'danger'
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
