<template lang="html">
  <div>
    <Tabs :value="current" @on-click="change">
      <TabPane label="Overview" name="newsInfo"></TabPane>
      <TabPane label="Edit" name="newsEdit" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    current: 'newsInfo'
  }),
  computed: {
    ...mapGetters({
      isAdmin: 'session/isAdmin'
    })
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

<style lang="css">
</style>
