<template lang="html">
  <tr>
    <td>{{ solution.sid }}</td>
    <td> <router-link
      :to="{name: 'problem', params: {pid: solution.pid}}"
    >
      {{ solution.pid }}
    </router-link> </td>
    <td> <router-link
        :to="{name: 'user', params: {uid: solution.uid}}"
      >
      {{ solution.uid }}
    </router-link></td>
    <td>{{ solution.judge | judgePretty }}</td>
    <td>{{ solution.time }} MS</td>
    <td>{{ solution.memory }} KB</td>
    <td> <a @click="showSource(solution)"> {{ solution.language | languagePretty }} </a> </td>
    <td>{{ solution.length }} B</td>
    <td>{{ solution.create | timePretty }}</td>
  </tr>
</template>

<script>
export default {
  props: ['solution'],
  methods: {
    showSource (solution) {
      this.$store.commit('showSolutionModal', solution)
    }
  }
}
</script>

<style lang="css">
</style>
