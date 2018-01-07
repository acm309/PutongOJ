<template lang="html">
  <div class="proinfo-wrap">
    <problem :problem="problem" />
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Problem from '@/components/Problem.vue'

export default {
  components: {
    Problem
  },
  computed: {
    ...mapGetters('problem', {
      problem: 'problem'
    })
  },
  created () {
    this.$store.dispatch('problem/findOne', this.$route.params)
  },
  methods: {
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
