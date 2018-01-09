<template lang="html">
  <div class="conin-wrap">
    <Card class="card">
      <Row type="flex" justify="center">
        <Col :span="6">Begin: {{ contest.start | timePretty }}</Col>
        <Col :span="12" v-if="Date.now() < contest.start">Ready</Col>
        <Col :span="12" v-if="Date.now() > contest.start && Date.now() < contest.end">Running</Col>
        <Col :span="12" v-if="Date.now() > contest.end">Ended</Col>
        <Col :span="6">End: {{ contest.end | timePretty }}</Col>
      </Row>
        <Progress :stroke-width="18" :percent="timePercentage"></Progress>
    </Card>
    <Tabs :value="display" @on-click="handleClick">
      <TabPane label="Overview" name="contestOverview"></TabPane>
      <TabPane label="Problem" name="contestProblem"></TabPane>
      <TabPane label="Submit" name="contestSubmit"></TabPane>
      <TabPane label="Status" name="contestStatus"></TabPane>
      <TabPane label="Ranklist" name="contestRanklist"></TabPane>
      <TabPane label="Edit" name="contestEdit"></TabPane>
    </Tabs>
    <router-view v-if="contest"></router-view>
    <!-- 为了确保之后的 children 能拿到 contest -->
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
      contest: 'contest'
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
    handleClick (name) {
      if (name === 'contestProblem' || name === 'contestSubmit') {
        this.$router.push({ name: name, params: { cid: this.$route.params.cid, id: this.$route.params.id || 1 } })
      } else {
        this.$router.push({ name: name, params: { cid: this.$route.params.cid } })
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
  .card
    margin-bottom: 20px
  .ivu-col
    text-align: center
    margin-bottom: 20px
    font-size: 16px
  .ivu-progress-bg
    background-color: #e040fb
  .ivu-progress-text
    color: #e040fb
</style>
