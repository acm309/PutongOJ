<template lang="html">
  <div>
    <h1 class="title is-1">News List</h1>
    <hr>
    <div class="notification animated flipInX" v-for="news in newsList" :key="news.nid">
      <p>{{ news.title }} <oj-reserve :status="news.status"></oj-reserve></p>
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
import { mapGetters } from 'vuex'

import Pagination from '../components/Pagination.vue'
import ReservedSpan from '../components/ReservedSpan.vue'

export default {
  components: {
    'oj-pagination': Pagination,
    'oj-reserve': ReservedSpan
  },
  props: [ 'page', 'limit' ],
  created () {
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
    ...mapGetters({
      newsList: 'newsList',
      pagination: 'newsPagination'
    })
  }
}
</script>

<style lang="css">
</style>
