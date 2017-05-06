<template lang="html">
  <div>
    <div class="content has-text-centered">
      <h3>{{ contest.title }}</h3>
      <p><b>From: </b>{{ contest.start | timePretty }} <b>To: </b>{{ contest.end | timePretty }}</p>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>#</th> <th>Id</th> <th>Title</th> <th>Submit</th> <th>Ratio</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>#</th> <th>Id</th> <th>Title</th> <th>Submit</th> <th>Ratio</th>
        </tr>
      </tfoot>
      <tbody>
        <tr v-for="(problem, index) in overview">
          <td></td>
          <td>{{ index }}</td>
          <td>{{ problem.title }}</td>
          <td><a @click="submit(problem)">
            <i class="fa fa-paper-plane fa-lg" aria-hidden="true"></i>
          </a></td>
          <td>{{ ratio(problem) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: ['contest', 'cid'],
  methods: {
    submit (problem) {

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
  }
}
</script>

<style lang="css">
</style>
