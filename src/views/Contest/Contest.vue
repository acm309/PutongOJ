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
            :to="{name: 'contest_status', params: {cid: cid}}"
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
import { mapGetters } from 'vuex'

import TimeRemainder from '../../components/TimeRemainder.vue'

export default {
  components: {
    'oj-timeremainder': TimeRemainder
  },
  props: ['cid'],
  created () {
    this.$store.dispatch('fetchContest', {
      cid: this.cid
    }).then(() => {
      document.title = `Contest -- ${this.contest.title}`
    }).catch((err) => {
      this.$store.dispatch('addMessage', {
        body: err.message,
        type: 'danger'
      })
    })
  },
  computed: {
    ...mapGetters({
      contest: 'contest',
      defaultPid: 'contestDefaultPid',
      self: 'self',
      logined: 'logined'
    })
  }
}
</script>

<style lang="css">
</style>
