<template lang="html">
<div class="card">
  <footer class="card-footer">
    <span class="card-footer-item"><b>Elpased:</b>{{ now | durationPretty }}</span>
    <span class="card-footer-item"><b>{{ status }}</b></span>
    <span class="card-footer-item"><b>Remaining:</b> -{{ remaining | durationPretty }}</span>
  </footer>
  <div class="card-content">
    <progress class="progress is-primary" :value="now" :max="end - start"></progress>
  </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: ['start', 'end'],
  computed: {
    now () {
      // 先确定比赛是否开始了
      if (this.currentTime < this.start) {
        return 0
      } else if (this.currentTime >= this.end) {
        return this.end - this.start
      }
      return this.currentTime - this.start
    },
    remaining () {
      return this.end - this.start - this.now
    },
    status () {
      if (this.currentTime >= this.end) {
        return 'Ended'
      }
      if (this.currentTime <= this.start) {
        return 'Scheduled'
      }
      return 'Running'
    },
    ...mapGetters([ 'currentTime' ])
  }
}
</script>

<style lang="css">
</style>
