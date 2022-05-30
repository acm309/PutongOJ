<template>
  <div>
    <h1>{{ this.$route.params.pid }}:  {{ title }}</h1>
    <submit></submit>
    <Button type="primary" @click="submit" :disabled="!isLogined">Submit</Button>
    <Button style="margin-left: 8px" @click="reset">Reset</Button>
    <p v-if="!isLogined">Please Log in First</p>
  </div>
</template>
<script>
import Submit from '@/components/Submit'
import { useSessionStore } from '@/store/modules/session'
import { mapState, mapActions } from 'pinia'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { useSolutionStore } from '@/store/modules/solution'

export default {
  data: () => ({
    title: ''
  }),
  computed: {
    ...mapState(useSessionStore, ['isLogined']),
    ...mapState(useProblemStore, ['problem']),
    ...mapState(useSolutionStore, ['solution'])
  },
  created () {
    // 这里必须保证此时 overview 是存在的
    // 如果用户没有点过 overview tab 时，就会出现 overview 不存在的情况
    let p = Promise.resolve()
    if (this.problem.title == null) {
      p = this.findOne({ pid: this.$route.params.pid })
    }
    p.then(() => {
      this.title = this.problem.title
      this.changeDomTitle({ title: `Problem ${this.problem.pid}` })
    })
  },
  methods: {
    ...mapActions(useRootStore, ['changeDomTitle']),
    ...mapActions(useProblemStore, ['findOne']),
    ...mapActions(useSolutionStore, ['clearCode', 'create']),
    reset () {
      this.clearCode()
    },
    submit () {
      this.create(Object.assign(
        {},
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
