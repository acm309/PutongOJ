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
    <button class="button is-primary" @click="submit">Submit</button>
    <oj-submitcodemodal
      v-if="active"
      @close="active = false"
      @submit="submitCode">
      {{ this.pid }} -- {{ this.problem.title }}
    </oj-submitcodemodal>
  </div>
</template>

<script>

import ProblemContent from '../../components/ProblemContent.vue'
import SubmitCodeModal from '../../components/SubmitCodeModal.vue'

export default {
  components: {
    'oj-problemcontent': ProblemContent,
    'oj-submitcodemodal': SubmitCodeModal
  },
  props: ['cid', 'pid', 'contest'],
  data () {
    return {
      active: false
    }
  },
  computed: {
    defaultPid () {
      return this.$store.getters.contestDefaultPid
    },
    problem () {
      return this.$store.getters.problem
    },
  },
  created () {
    this.$store.dispatch('fetchProblem', {
      pid: this.contest.list[this.pid],
      mid: this.cid
    })
    this.$store.commit('updateContestDefaultPid', {
      pid: +this.pid // 记得确保是数字
    })
  },
  methods: {
    submit (problem) {
      this.active = true
    },
    submitCode(payload) {
      payload.mid = this.cid
      payload.pid = this.problem.pid
      this.$store.dispatch('submitSolution', payload)
        .then(() => {
          this.active = false
        })
    },
    chooseProblem (index) {
      this.$store.commit('updateContestDefaultPid', {
        pid: index
      })
      this.$router.push({
        name: 'contest_problem',
        params: {
          cid: this.cid,
          pid: +index
        }
      })
      this.$store.dispatch('fetchProblem', {
        pid: +this.contest.list[index],
        mid: this.cid
      })
    }
  }
}
</script>

<style lang="css">
</style>
