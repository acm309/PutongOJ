<template lang="html">
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Description" name="problemInfo"></TabPane>
      <TabPane label="Submit" name="problemSubmit"></TabPane>
      <TabPane label="My Submissions" name="mySubmission"></TabPane>
      <TabPane label="Statistics" name="problemStatistics"></TabPane>
      <TabPane label="Edit" name="problemEdit" v-if="isAdmin"></TabPane>
      <TabPane label="Test Data" name="testcase" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import { Tabs, TabPane } from 'iview'
import { mapGetters } from 'vuex'

export default {
  components: {
    Tabs,
    TabPane
  },
  data: () => ({
    current: 'problemInfo'
  }),
  computed: {
    ...mapGetters('session', [ 'isAdmin' ])
  },
  methods: {
    change (name) {
      this.$router.push({ name, params: { pid: this.$route.params.pid } })
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) this.current = this.$route.name
    }
  }
}
</script>

<style>
</style>
