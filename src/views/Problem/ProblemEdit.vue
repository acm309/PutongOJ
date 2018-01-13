<template lang="html">
  <div class="proadd-wrap">
    <oj-problem-edit :problem="problem" />
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ProblemEdit from '@/components/ProblemEdit'

export default {
  computed: {
    ...mapGetters('problem', [
      'problem'
    ])
  },
  created () {
    this.$store.dispatch('problem/findOne', { pid: this.$route.params.pid })
  },
  methods: {
    submit () {
      this.$store.dispatch('problem/update', this.problem).then(({ data }) => {
        this.$Message.success('提交成功！')
        this.$router.push({name: 'problemInfo', params: { pid: data.pid }})
      })
    }
  },
  components: {
    'oj-problem-edit': ProblemEdit
  }
}
</script>

<style lang="stylus">
  .proadd-wrap
    margin-bottom: 20px
    .ivu-input-wrapper
      margin-bottom: 14px
    .label
      text-align:left
      margin-bottom: 10px
    #editor1, #editor2, #editor3, #editor4
      text-align: left
      height: 220px
      margin-bottom: 10px
    .el-textarea
      margin-bottom: 20px
</style>
