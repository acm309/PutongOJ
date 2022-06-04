<script>
import { mapActions, mapState } from 'pinia'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'
import { timePretty } from '@/util/formate'

export default {
  data () {
    return {
      display: '',
    }
  },
  computed: {
    ...mapState(useContestStore, [ 'contest' ]),
    ...mapState(useSessionStore, [ 'isAdmin' ]),
    ...mapState(useRootStore, [ 'currentTime' ]),
    timePercentage () {
      if (this.currentTime < this.contest.start) {
        return 0
      } else if (this.currentTime > this.contest.end) {
        return 100
      } else {
        return +((this.currentTime - this.contest.start) * 100
        / (this.contest.end - this.contest.start)).toFixed(1)
      }
    },
  },
  created () {
    this.display = this.$route.name
    this.findOne(this.$route.params)
  },
  methods: {
    timePretty,
    ...mapActions(useContestStore, [ 'findOne' ]),
    handleClick (name) {
      if (name === 'contestProblem' || name === 'contestSubmit') {
        this.$router.push({ name, params: { cid: this.$route.params.cid, id: this.$route.params.id || 1 } })
      } else {
        this.$router.push({ name, params: { cid: this.$route.params.cid } })
      }
    },
  },
  watch: {
    $route (to, from) {
      this.display = to.name
    },
  },
}
</script>

<template>
  <div class="conin-wrap">
    <Card class="card">
      <Row type="flex" justify="center">
        <Col :span="6">
          Begin: {{ timePretty(contest.start) }}
        </Col>
        <Col v-if="currentTime < contest.start" :span="12">
          Ready
        </Col>
        <Col v-if="currentTime > contest.start && currentTime < contest.end" :span="12">
          Running
        </Col>
        <Col v-if="currentTime > contest.end" :span="12">
          Ended
        </Col>
        <Col :span="6">
          End: {{ timePretty(contest.end) }}
        </Col>
      </Row>
      <Progress :stroke-width="18" :percent="timePercentage" />
    </Card>
    <Tabs :model-value="display" @on-click="handleClick">
      <TabPane label="Overview" name="contestOverview" />
      <TabPane label="Problem" name="contestProblem" />
      <TabPane label="Submit" name="contestSubmit" />
      <TabPane label="Status" name="contestStatus" />
      <TabPane label="Ranklist" name="contestRanklist" />
      <TabPane v-if="isAdmin" label="Edit" name="contestEdit" />
    </Tabs>
    <router-view v-if="contest && contest.cid" />
    <!-- 为了确保之后的 children 能拿到 contest -->
  </div>
</template>

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
