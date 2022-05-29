<template>
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Overview" name="newsInfo"></TabPane>
      <TabPane label="Edit" name="newsEdit" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>
<script>
import { mapState } from 'pinia'
import { useSessionStore } from '@/store/modules/session'

export default {
  data: () => ({
    current: 'newsInfo'
  }),
  computed: {
    ...mapState(useSessionStore, ['isAdmin'])
  },
  methods: {
    change (name) {
      this.$router.push({ name: name, params: { nid: this.$route.params.nid } })
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
</style>
