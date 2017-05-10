<template lang="html">
  <div>
    <div class="content has-text-centered">
      <h3>{{ contest.title }}</h3>
      <p><b>From: </b>{{ contest.start | timePretty }} <b>To: </b>{{ contest.end | timePretty }}</p>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>#</th> <th>Id</th> <th>Title</th> <th v-if="currentTime >= contest.start && currentTime <= contest.end">Submit</th> <th>Ratio</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>#</th> <th>Id</th> <th>Title</th> <th v-if="currentTime >= contest.start && currentTime <= contest.end">Submit</th> <th>Ratio</th>
        </tr>
      </tfoot>
      <tbody>
        <tr v-for="(problem, index) in overview">
          <td></td>
          <td>{{ index }}</td>
          <td><router-link
            :to="{name: 'contest_problem', params: {cid: cid, pid: index}}"
            >{{ problem.title }}</router-link></td>
          <td v-if="currentTime >= contest.start && currentTime <= contest.end">
            <a @click="submit(problem)">
              <i class="fa fa-paper-plane fa-lg" aria-hidden="true"></i>
            </a>
          </td>
          <td>{{ ratio(problem) }}</td>
        </tr>
      </tbody>
    </table>
    <oj-submitcodemodal
      v-if="active"
      @close="active = false"
      @submit="submitCode">
      {{ solutionTitle }}
    </oj-submitcodemodal>
  </div>
</template>

<script>

import SubmitCodeModal from '../../components/SubmitCodeModal.vue'

export default {
  components: {
    'oj-submitcodemodal': SubmitCodeModal
  },
  data () {
    return {
      active: false,
      solutionTitle: '',
      pid: ''
    }
  },
  props: ['contest', 'cid'],
  methods: {
    submit (problem) {
      this.active = true
      this.solutionTitle = `${this.contest.list.indexOf(problem.pid)} -- ${problem.title}`
      this.pid = problem.pid
    },
    submitCode (payload) {
      payload.pid = this.pid
      payload.mid = this.cid
      this.$store.dispatch('submitSolution', payload)
        .then(() => {
          this.active = false
        })
    },
    ratio (problem) {
      if (problem.submit === 0) {
        return `0.00% (${problem.solve} / ${problem.submit})`
      }
      return `${(problem.solve * 100 / problem.submit).toFixed(2)}% (${problem.solve} / ${problem.submit})`
    }
  },
  created () {
    this.$store.dispatch('fetchContestOverview', {
      cid: this.cid
    })
  },
  computed: {
    overview () {
      return this.$store.getters.contestOverview
    },
    currentTime () {
      return this.$store.getters.currentTime
    }
  }
}
</script>

<style lang="css">
</style>
