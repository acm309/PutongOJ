<template>
  <div class="proinfo-wrap">
    <problem :problem="problem" />
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>
<script>
import Problem from '@/components/Problem.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    Problem
  },
  computed: {
    ...mapGetters('problem', [ 'problem' ])
  },
  created () {
    this.$store.dispatch('problem/findOne', this.$route.params).then(() => {
      this.changeDomTitle({ title: `Problem ${this.problem.pid}` })
    })
  },
  methods: {
    ...mapActions(['changeDomTitle']),
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
