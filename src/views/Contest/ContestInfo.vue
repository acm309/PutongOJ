<template lang="html">
  <div class="conin-wrap">
    <Card>
      <Row>
        <Col :span="6">Begin: {{ contest.start | timePretty }}</Col>
        <Col :span="12" v-if="Date.now() < contest.start">Ready</Col>
        <Col :span="12" v-if="Date.now() > contest.start && Date.now() < contest.end">Running</Col>
        <Col :span="12" v-if="Date.now() > contest.end">Ended</Col>
        <Col :span="6">End: {{ contest.end | timePretty }}</Col>
      </Row>
      <el-progress :text-inside="true" :stroke-width="18" :percentage="timePercentage"></el-progress>
    </Card>
    <Tabs :value="display" @tab-click="handleClick">
      <TabPane label="Overview" name="contest.overview"></TabPane>
      <TabPane label="Problem" name="contest.problem"></TabPane>
      <TabPane label="Status" name="contest.status"></TabPane>
      <TabPane label="Ranklist" name="contest.ranklist"></TabPane>
      <TabPane label="Edit" name="contest.edit"></TabPane>
      <router-view></router-view>
    </Tabs>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      display: ''
    }
  },
  computed: {
    ...mapGetters('contest', {
      contest: 'one'
    }),
    timePercentage () {
      if (Date.now() < this.contest.start) {
        return 0
      } else if (Date.now() > this.contest.end) {
        return 100
      } else {
        return +((Date.now() - this.contest.start) * 100 /
        (this.contest.end - this.contest.start)).toFixed(1)
      }
    }
  },
  created () {
    this.display = this.$route.name
    this.$store.dispatch('contest/findOne', this.$route.params)
  },
  methods: {
    handleClick (tab) {
      if (tab.name === 'contest.problem') {
        this.$router.push({ name: tab.name, params: { cid: this.$route.params.cid, id: this.$route.params.id || 1 } })
      } else {
        this.$router.push({ name: tab.name, params: { cid: this.$route.params.cid } })
      }
    }
  },
  watch: {
    '$route' (to, from) {
      this.display = to.name
    }
  }
}
</script>

<style lang="stylus">
  .conin-wrap
    margin-bottom: 20px
    .Card
      margin-bottom: 20px
      .Row
        margin-bottom: 20px
</style>
