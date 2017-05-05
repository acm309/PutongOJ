<template lang="html">
  <div>
    <h1 class="title is-1">News List</h1>
    <hr>
    <div class="notification" v-for="news in newsList" :key="news.nid">
      <p>{{ news.title }}</p>
      <router-link
        :to="{name: 'news', params: {nid: news.nid}}"
      >Read More</router-link> {{ news.create | timePretty }}
    </div>
    <oj-pagination
      :pagination="pagination"
      @pageClick="pageClick"
    ></oj-pagination>
  </div>
</template>

<script>

import Pagination from '../components/Pagination.vue'

export default {
  components: {
    'oj-pagination': Pagination
  },
  props: [ 'page', 'limit' ],
  created() {
    document.title = 'Home'
    this.$store.dispatch('fetchNewsList', {
      page: this.page,
      limit: this.limit
    })
  },
  methods: {
    pageClick (page) {
      this.$store.dispatch('fetchNewsList', {
        page,
        limit: this.limit
      })
    }
  },
  computed: {
    newsList () {
      return this.$store.getters.newsList
    },
    pagination () {
      return this.$store.getters.newsPagination
    }
  }
}
</script>

<style lang="css">
</style>
