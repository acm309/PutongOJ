<template lang="html">
  <div>
    <div>
      <a
        class="pagination-link"
        :class="{'is-current': index === defaultPid}"
        v-for="(pid, index) in contest.list"
        @click="chooseProblem(index)"
      >{{ index }}</a>
    </div>
    <br>
    <oj-problemcontent
      :problem="problem"
    >
    <span slot="title"> {{pid}} -- {{problem.title}} </span>
    </oj-problemcontent>
    <hr>
    <button class="button is-primary">Submit</button>
  </div>
</template>

<script>

import ProblemContent from '../../components/ProblemContent.vue'

export default {
  components: {
    'oj-problemcontent': ProblemContent
  },
  props: ['cid', 'pid', 'contest'],
  computed: {
    defaultPid () {
      return this.$store.getters.contestDefaultPid
    },
    problem () {
      return this.$store.getters.problem
    }
  },
  created () {
    this.$store.dispatch('fetchProblem', {
      pid: this.contest.list[this.pid],
      mid: this.cid
    })
  },
  methods: {
    chooseProblem (index) {
      this.$store.commit('updateContestDefaultPid', {
        pid: index
      })
      this.$router.push({
        name: 'contest_problem',
        params: {
          cid: this.cid,
          pid: index
        }
      })
      this.$store.dispatch('fetchProblem', {
        pid: this.contest.list[index],
        mid: this.cid
      })
    }
  }
}
</script>

<style lang="css">
</style>
