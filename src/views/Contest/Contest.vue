<template lang="html">
  <div>
    <oj-timeremainder
      v-if="contest"
      :end="contest.end"
      :start="contest.start"
    >
    </oj-timeremainder>
    {{ contest.title }}
    {{ contest.list }}
  </div>
</template>

<script>

import TimeRemainder from '../../components/TimeRemainder.vue'

export default {
  components: {
    'oj-timeremainder': TimeRemainder
  },
  props: ['cid'],
  created () {
    this.$store.dispatch('fetchContest', {
      cid: this.cid
    })
    .then(() => {
      document.title = `Contest -- ${this.contest.title}`
    })
  },
  computed: {
    contest () {
      return this.$store.getters.contest
    }
  }
}
</script>

<style lang="css">
</style>
