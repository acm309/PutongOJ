<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Cid</th>
          <th>Title</th>
          <th>Start</th>
          <th>End</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contest in contestsList">
          <td>{{ contest.cid }}</td>
          <td>{{ contest.title }}</td>
          <td>{{ contest.start | timePretty }}</td>
          <td>{{ contest.end | timePretty }}</td>
          <td><a
              @click="changeStatus(contest)"
            >{{ contest.status | statusPretty }}</a></td>
          <td><router-link
              :to="{name: 'admin_contests_edit', params: {cid: contest.cid}}"
            >Edit</router-link></td>
          <td><a @click="del(contest)">Delete</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

import Pagination from '../../components/Pagination.vue'

export default {
  props: ['page', 'limit'],
  created () {
    this.$store.dispatch('fetchContestsList', {
      page: this.page,
      limit: this.limit
    })
  },
  computed: {
    contestsList () {
      return this.$store.getters.contestsList
    },
    status () {
      return this.$store.getters.status
    }
  },
  methods: {
    del (contest) {
      this.$store.dispatch('deleteContest', contest)
    },
    changeStatus (contest) {
      if (contest.status === this.status.Available) {
        contest.status = this.status.Reserve
      } else {
        contest.status = this.status.Available
      }
      this.$store.dispatch('updateContest', Object.assign(contest, {
        updateList: true
      }))
    }
  }
}
</script>

<style lang="css">
</style>
