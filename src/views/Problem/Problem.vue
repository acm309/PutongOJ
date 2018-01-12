<template lang="html">
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Description" name="problemInfo"></TabPane>
      <TabPane label="Submit" name="problemSubmit"></TabPane>
      <TabPane label="My Submissions" name="name3"></TabPane>
      <TabPane label="Statistics" name="problemStatistics"></TabPane>
      <TabPane label="Edit" name="problemEdit" v-if="isAdmin"></TabPane>
      <TabPane label="Test Data" name="name6" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    current: 'problemInfo'
  }),
  computed: {
    ...mapGetters({
      isAdmin: 'session/isAdmin'
    })
  },
  methods: {
    change (name) {
      this.$router.push({ name: name, params: { pid: this.$route.params.pid } })
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
