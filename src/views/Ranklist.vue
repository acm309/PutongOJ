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
          <td>
            <router-link
              :to="{name: 'user', params: {uid: user.uid}}"
            >
              {{ user.uid }}
            </router-link>
          </td>
          <td>{{ user.nick }}</td>
          <td>{{ user.motto }}</td>
          <td>{{ user.solve }}</td>
          <td>{{ user.submit }}</td>
          <td>{{ ratio(user) }}</td>
        </tr>
      </tbody>
    </table>
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Pagination from '../components/Pagination.vue'

export default {
  components: {
    'oj-pagination': Pagination
  },
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
    ...mapGetters({
      ranklist: 'ranklist',
      pagination: 'ranklistPagination'
    })
  },
  methods: {
    ratio (user) {
      // 不能除以 0，否则 NaN
      if (user.submit === 0) {
        return '0.00%'
      } else {
        return `${(user.solve * 100 / user.submit).toFixed(2)}%`
      }
    },
    pageClick (page) {
      this.$router.push({
        name: 'ranklist',
        query: {
          page
        }
      })
      // 同一组件，需要重新 dispatch
      // https://router.vuejs.org/en/essentials/dynamic-matching.html
      this.$store.dispatch('fetchRanklist', {
        page: page,
        limit: this.limit
      })
    }
  }
}
</script>

<style lang="css">
</style>
