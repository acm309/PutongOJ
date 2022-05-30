<script>
import { mapState } from 'pinia'
import { useSessionStore } from '@/store/modules/session'

export default {
  computed: {
    ...mapState(useSessionStore, [ 'isAdmin', 'canRemove' ]),
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
      this.$router.push({ name })
    },
  },
}
</script>

<template>
  <div class="usermanage">
    <Tabs :value="active" @on-click="change">
      <TabPane label="UserEdit" name="userEdit" />
      <TabPane label="GroupEdit" name="groupEdit" />
      <TabPane v-if="canRemove" label="AdminEdit" name="adminEdit" />
      <TabPane label="TagEdit" name="tagEdit" />
    </Tabs>
    <router-view />
  </div>
</template>

<style lang="stylus">
.usermanage
  h1
    margin-bottom: 20px
  .ivu-row-flex
    margin-bottom: 10px
  .label
    line-height: 32px
  .submit
    margin-bottom: 20px
</style>
