<template lang="html">
  <div>
    <oj-timeremainder
      v-if="contest"
      :end="contest.end"
      :start="contest.start"
    >
    </oj-timeremainder>
    <br>
    <div class="tabs is-boxed">
      <ul>
        <li class="is-active"><a><span>Overview</span></a></li>
        <li><a><span>Problem</span></a></li>
        <li><a><span>Status</span></a></li>
        <li><a><span>Ranklist</span></a></li>
      </ul>
    </div>
    <router-view
      v-if="contest"
      :contest="contest"
    >
    </router-view>
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
