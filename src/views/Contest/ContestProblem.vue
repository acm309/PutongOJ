<template lang="html">
  <div class="conpro-wrap">
    <Button
      class="page-button"
      v-for="i in totalProblems" :key="i"
      type="ghost" shape="circle" @click="pageChange(i)">
      {{ i }}
    </Button>
    <problem :problem="problem">
      <h1 slot="title">{{ this.$route.params.id }}:  {{ problem.title }}</h1>
    </problem>
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Problem from '@/components/Problem'

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
  mounted () {
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
        name: '',
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

<style lang="stylus">
.conpro-wrap
  .page-button
    margin-left: 1em
</style>
