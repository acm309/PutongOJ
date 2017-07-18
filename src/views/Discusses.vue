<template lang="html">
  <div class="animated fadeInLeft">
    <table class="table">
      <tbody>
        <tr v-for="discuss in discussesList">
          <td># {{ discuss.did }}</td>
          <td>{{ discuss.title }}</td>
          <td>{{ discuss.uid }}</td>
          <td>Updated on {{ discuss.update | timeFromNow }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([ 'discussesList' ])
  },
  created () {
    this.$store.dispatch('fetchDiscussesList')
  }
}
</script>

<style lang="css">
</style>
