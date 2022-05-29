<template>
  <div>
    <oj-problem-edit :problem="problem" />
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>
<script>
import ProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'
import { mapActions, mapState } from 'pinia'

export default {
  computed: {
    ...mapState(useProblemStore, ['problem'])
  },
  created () {
    this.findOne({ pid: this.$route.params.pid })
  },
  methods: {
    ...mapActions(useProblemStore, ['findOne']),
    submit () {
      this.$store.dispatch('problem/update', this.problem).then((data) => {
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
</style>
