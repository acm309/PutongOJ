<template>
  <div class="proinfo-wrap">
    <problem :problem="problem" />
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>
<script>
import Problem from '@/components/Problem.vue'
import { useProblemStore } from '@/store/modules/problem'
import { mapActions, mapState } from 'pinia'
import { useRootStore } from '@/store'

export default {
  components: {
    Problem
  },
  computed: {
    ...mapState(useProblemStore, ['problem'])
  },
  created () {
    this.findOne(this.$route.params).then(() => {
      this.changeDomTitle({ title: `Problem ${this.problem.pid}` })
    })
  },
  methods: {
    ...mapActions(useRootStore, ['changeDomTitle']),
    ...mapActions(useProblemStore, ['findOne']),
    submit () {
      this.$router.push({
        name: 'problemSubmit',
        params: this.$router.params
      })
    }
  }
}
</script>
<style>
</style>
