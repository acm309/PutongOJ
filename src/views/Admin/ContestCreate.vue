<template lang="html">
  <div>
    <!-- <pre>{{ jobs }} </pre> -->
    <!-- 这个注释故意留着，有时候偶用于调试蛮方便的 -->
    <h1>注意事项</h1>
    <br>
    <Steps :current="5" :style="{ color: 'black'}">
      <Step title="难度区分" content="正常情况下要有一两道几乎所有人能做出来的题目" status="process"></Step>
      <Step title="题目正确性" content="不要拿未测试的题目进入比赛" icon="ios-star" status="process"></Step>
    </Steps>
    <br>
    <oj-contest-edit :contest="contest"></oj-contest-edit>
    <Button type="primary" size="large" @click="submit">Submit</Button>
  </div>
</template>

<script>
import ContestEdit from '@/components/ContestEdit'

export default {
  data () {
    return {
      contest: {
        title: '',
        start: '',
        end: '',
        list: [],
        encrypt: ''
      }
    }
  },
  methods: {
    submit () {
      if (!this.contest.title) {
        this.$Message.error('Title can not be empty')
      } else if (!this.contest.start || !this.contest.end) {
        this.$Message.error('Time can not be empty')
      } else {
        this.$store.dispatch('contest/create', this.contest)
          .then((cid) => {
            this.$Message.success(`Contest "${this.contest.title}" has been created!`)
            this.$router.push({ name: 'contestOverview', params: { cid } })
          })
      }
    }
  },
  components: {
    'oj-contest-edit': ContestEdit
  }
}
</script>

<style lang="stylus" scoped>
</style>
