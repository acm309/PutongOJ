<template lang="html">
  <tr>
    <td>{{ solution.sid }}</td>
    <td>
      <slot name="pid"> <router-link
      :to="{name: 'problem', params: {pid: solution.pid}}"
    >
      {{ solution.pid }}
    </router-link> </slot> </td>
    <td> <router-link
        :to="{name: 'user', params: {uid: solution.uid}}"
      >
      {{ solution.uid }}
    </router-link></td>
    <td>{{ solution.judge | judgePretty }}</td>
    <td>{{ solution.time }} MS</td>
    <td>{{ solution.memory }} KB</td>
    <td>
      <a v-if="logined && (self.uid === solution.uid || isAdmin)" @click="showSource(solution)"> {{ solution.language | languagePretty }} </a>
      <span v-else> {{ solution.language | languagePretty }} </span>
    </td>
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
  },
  computed: {
    isAdmin() {
      return this.$store.getters.isAdmin
    },
    self () {
      return this.$store.getters.self
    },
    logined () {
      return this.$store.getters.logined
    }
  }
}
</script>

<style lang="css">
</style>
