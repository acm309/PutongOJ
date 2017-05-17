<template lang="html">
  <div>
    <div class="content">
      <oj-problemcontent :problem="problem">
      </oj-problemcontent>
    </div>
    <hr>
    <a
      class="button is-primary"
      :disabled="!self"
      @click="active = true && self"
    >Submit</a>
    <router-link
      class="button"
      :to="{name: 'statistics', params: {pid}}"
    > Statistics </router-link>
    <p v-if="!self">
      <a @click="login">Log in</a> to submit
    </p>
    <transition
      name="custom-classes-transition"
      enter-active-class="animated fadeInUp"
      leave-active-class="animated fadeOutDown"
    >
      <oj-submitcodemodal
        v-if="active"
        @close="active=false"
        @submit="submit"
      >{{ problem.pid }} -- {{ problem.title }}</oj-submitcodemodal>
    </transition>
  </div>

</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

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
    }).catch((err) => {
      this.$store.dispatch('addMessage', {
        body: err.message,
        type: 'danger'
      })
    })
  },
  computed: {
    ...mapGetters([
      'problem',
      'self'
    ])
  },
  methods: {
    ...mapMutations({ login: 'showLoginModal' }),
    submit (payload) {
      this.$store.dispatch('submitSolution', Object.assign(payload, {
        pid: this.problem.pid
      }))
      .then(() => {
        // 跳转到 status 页面查看提交结果
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
