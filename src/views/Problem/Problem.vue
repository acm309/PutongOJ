<template lang="html">
  <div>
    <Tabs value="name1">
      <TabPane label="Description" name="name1"></TabPane>
      <TabPane label="Submit" name="name2"></TabPane>
      <TabPane label="My Submissions" name="name3"></TabPane>
      <TabPane label="Statistics" name="name4"></TabPane>
      <TabPane label="Edit" name="name5"></TabPane>
      <TabPane label="Test Data" name="name6"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
}
</script>

<style>
</style>
