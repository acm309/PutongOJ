<template>
  <div class="conin-wrap">
    <Card class="card">
      <Row type="flex" justify="center">
        <Col :span="6">Begin: {{ contest.start | timePretty }}</Col>
        <Col :span="12" v-if="currentTime < contest.start">Ready</Col>
        <Col :span="12" v-if="currentTime > contest.start && currentTime < contest.end">Running</Col>
        <Col :span="12" v-if="currentTime > contest.end">Ended</Col>
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
      <TabPane label="Edit" name="contestEdit" v-if="isAdmin"></TabPane>
    </Tabs>
    <router-view v-if="contest && contest.cid"></router-view>
    <!-- 为了确保之后的 children 能拿到 contest -->
  </div>
</template>
<script>
import { useSessionStore } from '@/store/modules/session'
import { mapActions, mapState } from 'pinia'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'

export default {
  data () {
    return {
      display: ''
    }
  },
  computed: {
    ...mapState(useContestStore, ['contest']),
    ...mapState(useSessionStore, ['isAdmin']),
    ...mapState(useRootStore, ['currentTime']),
    timePercentage () {
      if (this.currentTime < this.contest.start) {
        return 0
      } else if (this.currentTime > this.contest.end) {
        return 100
      } else {
        return +((this.currentTime - this.contest.start) * 100 /
        (this.contest.end - this.contest.start)).toFixed(1)
      }
    }
  },
  created () {
    this.display = this.$route.name
    this.findOne(this.$route.params)
  },
  methods: {
    ...mapActions(useContestStore, ['findOne']),
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
