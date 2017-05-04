<template lang="html">
  <div class="">
    <div class="content">
      <h1>{{ news.title }}</h1>
      <h6>{{ news.create | timePretty }}</h6>
      <hr>
      <div v-html="news.content">

      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['nid'],
  created () {
    this.$store.dispatch('fetchNews', {
      nid: this.nid
    })
  },
  computed: {
    news () {
      return this.$store.getters.news
    }
  }
}
</script>

<style lang="css">
</style>
