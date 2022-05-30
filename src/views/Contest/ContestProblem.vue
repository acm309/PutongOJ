<script>
import { mapActions, mapState } from 'pinia'
import Problem from '@/components/Problem'
import { useProblemStore } from '@/store/modules/problem'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'

export default {
  components: {
    Problem,
  },
  data () {
    return {
      proIndex: parseInt(this.$route.params.id),
    }
  },
  computed: {
    ...mapState(useProblemStore, [ 'problem' ]),
    ...mapState(useContestStore, [ 'overview', 'totalProblems' ]),
  },
  created () {
    this.fetch()
    this.changeDomTitle({ title: `Contest ${this.$route.params.cid}` })
  },
  methods: {
    ...mapActions(useRootStore, [ 'changeDomTitle' ]),
    ...mapActions(useProblemStore, {
      findOneProblem: 'findOne',
    }),
    ...mapActions(useContestStore, [ 'findOne' ]),
    async fetch () {
      this.proIndex = parseInt(this.$route.params.id)
      const data = await this.findOne(this.$route.params)
      this.findOneProblem({ pid: data.overview[this.proIndex - 1].pid, cid: data.contest.cid })
    },
    pageChange (val) {
      this.$router.push({
        name: 'contestProblem',
        params: { id: val },
      })
    },
    submit () {
      this.$router.push({
        name: 'contestSubmit',
        params: this.$router.params,
      })
    },
  },
  watch: {
    $route (to, from) {
      if (to !== from && to.name === 'contestProblem') { this.fetch() }
    },
  },
}
</script>

<template>
  <div class="conpro-wrap">
    <ul>
      <li v-for="i in totalProblems" :key="i" :class="{ active: i === proIndex }" @click="pageChange(i)">
        {{ i }}
      </li>
    </ul>
    <Problem :problem="problem">
      <h1 slot="title">
        {{ $route.params.id }}:  {{ problem.title }}
      </h1>
    </Problem>
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      Submit
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
ul
  margin-left: 10px
  li
    display: inline-block
    vertical-align: middle
    min-width: 32px
    height: 32px
    line-height: 30px
    margin-right: 8px
    text-align: center
    list-style: none
    background-color: #fff
    border: 1px solid #dddee1
    border-radius: 4px
    cursor: pointer
  .active
    color: #fff
    background-color: #e040fb
    border-color: #e040fb
</style>
