<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Nid</th>
          <th>Title</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="news in newsList">
          <td>{{ news.nid }}</td>
          <td><router-link
              :to="{name: 'news', params: {nid: news.nid}}"
            >{{ news.title }}</router-link></td>
          <td><a
              class="hint--right"
              aria-label="Click to change status"
              @click="changeStatus(news)"
            >{{ news.status | statusPretty }}</a></td>
          <td><a>Edit</a></td>
          <td><a @click="del(news)">Delete</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  created () {
    this.$store.dispatch('fetchNewsList')
  },
  computed: {
    newsList () {
      return this.$store.getters.newsList
    }
  },
  methods: {
    changeStatus (news) {
      const status = this.$store.getters.status
      if (news.status === status.Reserve) {
        news.status = status.Available
      } else {
        news.status = status.Reserve
      }
      this.$store.dispatch('updateNews', Object.assign(news, {
        updateList: true
      }))
    },
    del (news) {
      this.$store.dispatch('deleteNews', news)
    }
  }
}
</script>

<style lang="css">
</style>
