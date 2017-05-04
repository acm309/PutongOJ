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
  </div>
</template>

<script>
export default {
  created() {
    document.title = 'Home'
    this.$store.dispatch('fetchNewsList')
  },
  computed: {
    newsList () {
      return this.$store.getters.newsList
    }
  }
}
</script>

<style lang="css">
</style>
