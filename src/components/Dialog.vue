<template lang="html">
  <div class="dialog-wrap">
    <Tabs v-model="event">
      <TabPane label="Login" name="login"></TabPane>
      <TabPane label="Register" name="register"></TabPane>
    </Tabs>
  </div>
</template>

<script>
export default {
  data: () => ({
    event: 'login'
  })
}
</script>

<style lang="stylus">
</style>
