<template lang="html">
  <div class="conpro-wrap">
    <ul>
      <li v-for="i in totalProblems" :key="i" :class="{'active': i === proIndex}" @click="pageChange(i)">
        {{ i }}
      </li>
    </ul>
    <problem :problem="problem">
      <h1 slot="title">{{ this.$route.params.id }}:  {{ problem.title }}</h1>
    </problem>
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>

<script>
import Problem from '@/components/Problem'
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      proIndex: parseInt(this.$route.params.id)
    }
  },
  components: {
    Problem
  },
  computed: {
    ...mapGetters({
      problem: 'problem/problem',
      overview: 'contest/overview',
      totalProblems: 'contest/totalProblems'
    })
  },
  created () {
    this.fetch()
  },
  methods: {
    fetch () {
      this.proIndex = parseInt(this.$route.params.id)
      this.$store.dispatch('contest/findOne', this.$route.params).then((data) => {
        this.$store.dispatch('problem/findOne', { pid: data.res[this.proIndex - 1].pid })
      })
    },
    reload (val) {
      this.$router.push({
        name: 'contestProblem',
        params: { id: val }
      })
    },
    pageChange (val) {
      this.$router.push({
        name: 'contestProblem',
        params: { id: val }
      })
    },
    submit () {
      this.$router.push({
        name: 'contestSubmit',
        params: this.$router.params
      })
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from && to.name === 'contestProblem') this.fetch()
    }
  }
}
</script>

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
