<script>
import { mapActions, mapState } from 'pinia'
import ProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'

export default {
  computed: {
    ...mapState(useProblemStore, [ 'problem' ]),
  },
  created () {
    this.findOne({ pid: this.$route.params.pid })
  },
  methods: {
    ...mapActions(useProblemStore, [ 'findOne', 'update' ]),
    async submit () {
      const data = await this.update(this.problem)
      this.$Message.success('提交成功！')
      this.$router.push({ name: 'problemInfo', params: { pid: data.pid } })
    },
  },
  components: {
    OjProblemEdit: ProblemEdit,
  },
}
</script>

<template>
  <div>
    <OjProblemEdit :problem="problem" />
    <Button type="primary" @click="submit">
      Submit
    </Button>
  </div>
</template>

<style lang="stylus">
</style>
