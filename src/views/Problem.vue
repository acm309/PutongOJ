<template lang="html">
  <div class="content">
    <oj-problemcontent :problem="problem">
    </oj-problemcontent>
    <hr>
    <a
      class="button is-primary"
      :disabled="!self"
      @click="active = true && self"
    >Submit</a>
    <a class="button"> Statistics </a>
    <p v-if="!self">
      <a @click="login">Log in</a> to submit
    </p>
    <oj-submitcodemodal
      v-if="active"
      @close="active=false"
      @submit="submit"
    >
      {{ problem.pid }} -- {{ problem.title }}
    </oj-submitcodemodal>
  </div>
</template>

<script>

import ProblemContent from '../components/ProblemContent.vue'
import SubmitCodeModal from '../components/SubmitCodeModal.vue'

export default {
  components: {
    'oj-problemcontent': ProblemContent,
    'oj-submitcodemodal': SubmitCodeModal
  },
  data () {
    return {
      active: false
    }
  },
  props: [ 'pid' ],
  created () {
    this.$store.dispatch('fetchProblem', {
      pid: this.pid
    }).then(() => {
      document.title = `Problem ${this.problem.pid} -- ${this.problem.title}`
    })
  },
  computed: {
    problem () {
      return this.$store.getters.problem
    },
    self () {
      return this.$store.getters.self
    }
  },
  methods: {
    login () {
      this.$store.commit('showLoginModal')
    },
    submit (payload) {
      this.$store.dispatch('submitSolution', Object.assign(payload, {
        pid: this.problem.pid
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
