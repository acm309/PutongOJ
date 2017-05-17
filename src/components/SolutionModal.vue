<template lang="html">
  <transition
    name="custom-classes-transition"
    enter-active-class="animated fadeInUp"
    leave-active-class="animated fadeOutDown"
  >
    <div class="modal is-active" v-if="solutionModalActive">
      <div class="modal-background" @click="close"></div>
      <div class="modal-content code-modal">
        <pre>
          <code v-html="code"></code>
        </pre>
      </div>
      <button class="modal-close" @click="close"></button>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  created () {
    this.$store.dispatch('fetchSolution', { sid: this.sid })
  },
  computed: {
    ...mapGetters([
      'solution',
      'solutionModalActive',
      'sid'
    ]),
    code () {
      if (this.solution && this.solution.code) {
        if (this.solution.error) {
          return window.hljs.highlightAuto(`/**\n${this.solution.error}\n*/\n${this.solution.code}`).value
        }
        return window.hljs.highlightAuto(this.solution.code).value
      }
    }
  },
  methods: {
    ...mapMutations({
      close: 'closeSolutionModal'
    })
  }
}
</script>

<style lang="css">
</style>
