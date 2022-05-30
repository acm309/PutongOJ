<script>
import { mapState } from 'pinia'
import { useSessionStore } from '@/store/modules/session'

export default {
  data: () => ({
    current: 'newsInfo',
  }),
  computed: {
    ...mapState(useSessionStore, [ 'isAdmin' ]),
  },
  watch: {
    $route (to, from) {
      if (to !== from) { this.current = this.$route.name }
    },
  },
  methods: {
    change (name) {
      this.$router.push({ name, params: { nid: this.$route.params.nid } })
    },
  },
}
</script>

<template>
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Overview" name="newsInfo" />
      <TabPane v-if="isAdmin" label="Edit" name="newsEdit" />
    </Tabs>
    <router-view />
  </div>
</template>

<style lang="stylus">
</style>
