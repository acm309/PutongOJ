<template lang="html">
  <div>
    <h1>{{ this.$route.params.pid }}:  {{ title }}</h1>
    <submit></submit>
    <Button type="primary" @click="submit">Submit</Button>
    <Button type="ghost" style="margin-left: 8px" @click="reset">Reset</Button>
  </div>
</template>

<script>
import Submit from '@/components/Submit'
import { mapGetters, mapActions } from 'vuex'

export default {
  data: () => ({
    title: ''
  }),
  computed: {
    ...mapGetters({
      solution: 'solution/solution',
      problem: 'problem/problem'
    })
  },
  created () {
    // 这里必须保证此时 overview 是存在的
    // 如果用户没有点过 overview tab 时，就会出现 overview 不存在的情况
    let p = Promise.resolve()
    if (this.problem.title == null) {
      p = this.$store.dispatch('problem/findOne', { pid: this.$route.params.pid })
    }
    p.then(() => {
      this.title = this.problem.title
      this.changeDomTitle({ title: `Problem ${this.problem.pid}` })
    })
  },
  methods: {
    ...mapActions(['changeDomTitle']),
    reset () {
      this.$store.commit('solution/GET_SOLUTION', Object.assign(
        this.solution,
        { code: '' }
      ))
    },
    submit () {
      this.$store.dispatch('solution/create', Object.assign(
        this.solution,
        { pid: this.problem.pid }
      )).then(() => {
        this.$Message.info(`submit pid:${this.problem.pid} success!`)
        this.$router.push({ name: 'mySubmission', params: { pid: this.$route.params.pid } })
      })
    }
  },
  components: {
    Submit
  }
}
</script>

<style lang="stylus" scoped>
h1
  color: #9799ca
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
