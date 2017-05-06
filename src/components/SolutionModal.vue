<template lang="html">
  <div class="modal" :class="{'is-active': solutionModalActive}">
    <div class="modal-background" @click="close"></div>
    <div class="modal-content code-modal">
      <pre>
        <code v-html="code"></code>
      </pre>
    </div>
    <button class="modal-close" @click="close"></button>
  </div>
</template>

<script>
export default {
  created () {
    this.$store.dispatch('fetchSolution', { sid: this.sid })
  },
  computed: {
    solution () {
      return this.$store.getters.solution
    },
    solutionModalActive () {
      return this.$store.getters.solutionModalActive
    },
    sid () {
      return this.$store.getters.sid
    },
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
    close () {
      this.$store.commit('closeSolutionModal')
    }
  }
}
</script>

<style lang="css">
</style>
