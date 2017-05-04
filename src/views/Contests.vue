<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Cid</th>
          <th>Title</th>
          <th>Status</th>
          <th>Start Time</th>
          <th>Type</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>Cid</th>
          <th>Title</th>
          <th>Status</th>
          <th>Start Time</th>
          <th>Type</th>
        </tr>
      </tfoot>
      <tbody>
        <tr
          v-for="contest in contestsList"
          :key="contest.cid"
        >
          <td>{{ contest.cid }}</td>
          <td>{{ contest.title }}</td>
          <td>{{ status(contest) }}</td>
          <td>{{ contest.start | timePretty }}</td>
          <td>{{ contest.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  created () {
    document.title = 'Contests'
    this.$store.dispatch('fetchContestsList')
  },
  computed: {
    contestsList () {
      return this.$store.getters.contestsList
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
    }
  }
}
</script>

<style lang="css">
</style>
