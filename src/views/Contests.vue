<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Cid</th> <th>Title</th> <th>Status</th> <th>Start Time</th> <th>Type</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>Cid</th> <th>Title</th> <th>Status</th> <th>Start Time</th> <th>Type</th>
        </tr>
      </tfoot>
      <tbody>
        <tr
          v-for="contest in contestsList"
          :key="contest.cid"
        >
          <td>{{ contest.cid }}</td>
          <td><router-link v-if="logined"
              :to="{name: 'contest', params: {cid: contest.cid}}"
            > {{ contest.title }} </router-link>
            <a @click="login" v-else>{{ contest.title }}</a>
          </td>
          <td><b>{{ status(contest) }}</b></td>
          <td>{{ contest.start | timePretty }}</td>
          <td>{{ contest.encrypt | encryptPretty }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
// TODO 权限检查
export default {
  created () {
    document.title = 'Contests'
    this.$store.dispatch('fetchContestsList')
  },
  computed: {
    contestsList () {
      return this.$store.getters.contestsList
    },
    logined () {
      return this.$store.getters.logined
    }
  },
  methods: {
    status (contest) {
      if (this.$store.getters.currentTime < contest.start) {
        return 'Scheduled'
      } else if (this.$store.getters.currentTime > contest.end) {
        return 'Ended'
      }
      return 'Running'
    },
    login () {
      this.$store.commit('showLoginModal')
    }
  }
}
</script>

<style lang="css">
</style>
