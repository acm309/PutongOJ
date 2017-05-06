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
        <router-link
            tag="li"
            :to="{name: 'contest', params: {cid: cid}}"
            exact
          ><a><span>Overview</span></a></router-link>
        <router-link
            tag="li"
            :to="{name: 'contest_problem', params: {cid: cid, pid: defaultPid}}"
            exact
          ><a><span>Problem</span></a></router-link>
        <router-link
            tag="li"
            :to="{name: 'contest_status', params: {cid: cid}, query: {uid: self.uid}}"
          ><a><span>Status</span></a></router-link>
        <router-link
            tag="li"
            :to="{name: 'contest_ranklist', params: {cid: cid}}"
          ><a><span>Ranklist</span></a></router-link>
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
    },
    defaultPid () {
      return this.$store.getters.contestDefaultPid
    },
    self () {
      return this.$store.getters.self
    }
  }
}
</script>

<style lang="css">
</style>
