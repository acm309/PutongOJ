<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Nick</th>
          <th>Motto</th>
          <th>Solve</th>
          <th>Submit</th>
          <th>Ratio</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Nick</th>
          <th>Motto</th>
          <th>Solve</th>
          <th>Submit</th>
          <th>Ratio</th>
        </tr>
      </tfoot>
      <tbody>
        <tr
          v-for="(user, index) in ranklist"
          :key="user.uid"
        >
          <td> {{ (page - 1) * limit + index + 1 }} </td>
          <td>{{ user.uid }}</td>
          <td>{{ user.nick }}</td>
          <td>{{ user.motto }}</td>
          <td>{{ user.solve }}</td>
          <td>{{ user.submit }}</td>
          <td>{{ ratio(user) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    page: {
      default: 1,
    },
    limit: {
      default: 30
    }
  },
  created() {
    document.title = 'Ranklist'
    this.$store.dispatch('fetchRanklist', {
      page: this.page,
      limit: this.limit
    })
  },
  computed: {
    ranklist () {
      return this.$store.getters.ranklist
    }
  },
  methods: {
    ratio (user) {
      if (user.submit === 0) {
        return '0.00%'
      } else {
        return `${(user.solve * 100 / user.submit).toFixed(2)}%`
      }
    }
  }
}
</script>

<style lang="css">
</style>
