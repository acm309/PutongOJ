<template>
  <div>
    <h1>{{ this.$route.params.id }}:  {{ title }}</h1>
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
      problems: 'contest/problems',
      overview: 'contest/overview'
    })
  },
  created () {
    // 这里必须保证此时 overview 是存在的
    // 如果用户没有点过 overview tab 时，就会出现 overview 不存在的情况
    let p = Promise.resolve()
    if (this.overview.length === 0) {
      p = this.$store.dispatch('contest/findOne', { cid: this.$route.params.cid })
    }
    p.then(() => {
      this.title = this.overview[+this.$route.params.id - 1].title
      this.changeDomTitle({ title: `Contest ${this.$route.params.cid}` })
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
        {
          pid: this.problems[+this.$route.params.id - 1],
          mid: this.$route.params.cid
        }
      )).then(() => {
        this.$router.push({ name: 'contestStatus', params: { cid: this.$route.params.cid, id: this.$route.params.id } })
        this.$Message.info(`submit id:${this.$route.params.id} success!`)
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
