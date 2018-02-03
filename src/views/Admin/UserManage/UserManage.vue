<template lang="html">
  <div class="usermanage">
    <Tabs :value="actived" @on-click="change">
      <TabPane label="UserEdit" name="userEdit"></TabPane>
      <TabPane label="GroupEdit" name="groupEdit"></TabPane>
      <TabPane label="AdminEdit" name="adminEdit"></TabPane>
      <TabPane label="TagEdit" name="tagEdit"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('session', [ 'isAdmin' ]),
    ...mapState({
      actived: state => state.route.name
    })
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
