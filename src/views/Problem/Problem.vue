<template lang="html">
  <div>
    <Tabs :value="active" @on-click="change">
      <TabPane label="Description" name="problemInfo"></TabPane>
      <TabPane label="Submit" name="problemSubmit"></TabPane>
      <TabPane label="My Submissions" name="mySubmission" v-if="isLogined"></TabPane>
      <TabPane label="Statistics" name="problemStatistics"></TabPane>
      <TabPane label="Edit" name="problemEdit" v-if="isAdmin"></TabPane>
      <TabPane label="Test Data" name="testcase" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('session', [ 'isAdmin', 'isLogined' ]),
    ...mapState({
      active: state => state.route.name
    })
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
