<template>
  <div class="usermanage">
    <Tabs :value="active" @on-click="change">
      <TabPane label="UserEdit" name="userEdit"></TabPane>
      <TabPane label="GroupEdit" name="groupEdit"></TabPane>
      <TabPane label="AdminEdit" name="adminEdit" v-if="canRemove"></TabPane>
      <TabPane label="TagEdit" name="tagEdit"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>
<script>
import { useSessionStore } from '@/store/modules/session'
import { mapState } from 'pinia'

export default {
  computed: {
    ...mapState(useSessionStore, [ 'isAdmin', 'canRemove' ]),
    active () {
      return this.$route.name
    }
  },
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
