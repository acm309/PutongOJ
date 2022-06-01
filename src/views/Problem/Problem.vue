<script>
import { mapState } from 'pinia'
import { useSessionStore } from '@/store/modules/session'

export default {
  computed: {
    ...mapState(useSessionStore, [ 'isAdmin', 'isLogined' ]),
    active () {
      return this.$route.name
    },
  },
  watch: {
    $route (to, from) {
      if (to !== from) { this.current = this.$route.name }
    },
  },
  methods: {
    change (name) {
      if (name !== this.$route.name) { this.$router.push({ name, params: { pid: this.$route.params.pid } }) }
    },
  },
}
</script>

<template>
  <div>
    <Tabs :model-value="active" @on-click="change">
      <TabPane label="Description" name="problemInfo" />
      <TabPane label="Submit" name="problemSubmit" />
      <TabPane v-if="isLogined" label="My Submissions" name="mySubmission" />
      <TabPane label="Statistics" name="problemStatistics" />
      <!-- <TabPane label="Discuss" name="Discuss"></TabPane> -->
      <TabPane v-if="isAdmin" label="Edit" name="problemEdit" />
      <TabPane v-if="isAdmin" label="Test Data" name="testcase" />
    </Tabs>
    <router-view />
  </div>
</template>

<style>
</style>
