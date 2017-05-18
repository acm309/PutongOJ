<template lang="html">
  <tr>
    <td>
      <slot name="sid">
        {{ solution.sid }}
      </slot>
    </td>
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
    <td :class="`is-judge-${solution.judge}`" >{{ solution.judge | judgePretty }}</td>
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
import { mapGetters } from 'vuex'

export default {
  props: ['solution'],
  methods: {
    showSource (solution) {
      this.$store.commit('showSolutionModal', solution)
    }
  },
  computed: {
    ...mapGetters([
      'isAdmin',
      'self',
      'logined'
    ])
  }
}
</script>

<style lang="css">
</style>
