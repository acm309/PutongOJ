<template lang="html">
  <div>
    <h1 class="title is-1">News List</h1>
    <hr>
    <div class="notification" v-for="news in newsList" :key="news.nid">
      <p>{{ news.title }}</p>
      <a>Read More</a> {{news.create}}
    </div>
  </div>
</template>

<script>
export default {
  created() {
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
