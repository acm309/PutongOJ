<template lang="html">
  <div>
    <oj-problem-edit :problem="problem" />
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { Button } from 'iview'
import ProblemEdit from '@/components/ProblemEdit'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('problem', [ 'problem' ])
  },
  created () {
    this.$store.dispatch('problem/findOne', { pid: this.$route.params.pid })
  },
  methods: {
    submit () {
      this.$store.dispatch('problem/update', this.problem).then((data) => {
        this.$Message.success('提交成功！')
        this.$router.push({name: 'problemInfo', params: { pid: data.pid }})
      })
    }
  },
  components: {
    'oj-problem-edit': ProblemEdit,
    Button
  }
}
</script>

<style lang="stylus">
</style>
