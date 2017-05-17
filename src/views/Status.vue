<template lang="html">
  <div>
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">User</label>
      </div>
      <div class="field-body">
        <div class="field">
          <p class="control is-expanded">
            <input class="input" type="text" placeholder="Username" v-model="searchUid">
          </p>
        </div>
        <div class="field-label is-normal">
          <label class="label">Pid</label>
        </div>
        <div class="field">
          <p class="control is-expanded">
            <input class="input" type="text" placeholder="Problem id" v-model="searchPid">
          </p>
        </div>
        <div class="field-label is-normal">
          <label class="label">Judge</label>
        </div>
        <div class="field">
          <p class="control is-expanded has-icons-left has-icons-right">
            <div class="select">
              <select v-model="searchJudge">
                <option :value="undefined">ALL</option>
                <option
                  v-for="(name, code) in JUDGES"
                  :value="code">{{ name }}</option>
              </select>
            </div>
          </p>
        </div>
        <div class="field-label is-normal">
          <label class="label">Language</label>
        </div>
        <div class="field">
          <p class="control is-expanded has-icons-left has-icons-right">
            <div class="select">
              <select v-model="searchLanguage">
                <option :value="undefined">ALL</option>
                <option
                  v-for="(name, code) in LANGUAGES"
                  :value="code">{{ name }}</option>
              </select>
            </div>
          </p>
        </div>
        <div class="field">
          <button class="button is-primary" @click="search">Search</button>
        </div>
      </div>
    </div>
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
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
import { mapGetters } from 'vuex'

import SolutionItem from '../components/SolutionItem.vue'
import Pagination from '../components/Pagination.vue'

export default {
  data () {
    // 如果用 null，那么 post 的是否，这些属性会当作空字符串传，如 ?searchLanguage=&searchUid=
    return {
      searchUid: undefined,
      searchPid: undefined,
      searchJudge: undefined,
      searchLanguage: undefined
    }
  },
  components: {
    'oj-pagination': Pagination,
    'oj-solutionitem': SolutionItem
  },
  props: [ 'page', 'limit', 'judge', 'language', 'uid', 'pid' ],
  computed: {
    ...mapGetters({
      solutions: 'solutionsList',
      pagination: 'solutionsPagination',
      JUDGES: 'judges',
      LANGUAGES: 'languages'
    })
  },
  created () {
    document.title = 'Status'
    this.$store.dispatch('fetchSolutionsList', {
      page: this.page,
      limit: this.limit,
      uid: this.uid,
      pid: this.pid,
      language: this.language,
      judge: this.judge
    })
    this.updateSearch()
  },
  methods: {
    pageClick (page) {
      // 侧重于 url 上的 query
      const query = {
        page,
        limit: this.limit,
        uid: this.uid,
        pid: this.pid,
        language: this.language,
        judge: this.judge
      }
      this.$router.push({
        name: 'status',
        query
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchSolutionsList', query)
    },
    search () {
      // 侧重于 search 中的 query
      const query = {
        page: 1,
        limit: this.limit,
        uid: this.searchUid === '' ? undefined : this.searchUid,
        pid: this.searchPid === '' ? undefined : this.searchPid,
        language: this.searchLanguage,
        judge: this.searchJudge
      }
      this.$router.push({
        name: 'status',
        query
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchSolutionsList', query)
    },
    // 其实就是设置初始值
    updateSearch () {
      this.searchUid = this.uid
      this.searchPid = this.pid
      this.searchJudge = this.judge
      this.language = this.language
    }
  }
}
</script>

<style lang="css">
</style>
