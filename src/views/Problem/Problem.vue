<template lang="html">
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Description" name="problemInfo"></TabPane>
      <TabPane label="Submit" name="problemSubmit"></TabPane>
      <TabPane label="My Submissions" name="name3"></TabPane>
      <TabPane label="Statistics" name="problemStatistics"></TabPane>
      <TabPane label="Edit" name="name5"></TabPane>
      <TabPane label="Test Data" name="name6"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data: () => ({
    current: 'problemInfo'
  }),
  methods: {
    change (name) {
      this.$router.push({ name })
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
