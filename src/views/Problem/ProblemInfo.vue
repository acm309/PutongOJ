<template lang="html">
  <div class="proinfo-wrap">
    <problem :problem="problem" />
    <Button type="ghost" shape="circle" icon="ios-paperplane" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { Button } from 'iview'
import Problem from '@/components/Problem.vue'
import { mapGetters } from 'vuex'

export default {
  components: {
    Problem,
    Button
  },
  computed: {
    ...mapGetters('problem', [ 'problem' ])
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
