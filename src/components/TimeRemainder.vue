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
export default {
  props: ['start', 'end'],
  computed: {
    now () {
      if (this.$store.getters.currentTime >= this.end) {
        return this.end - this.start
      }
      return this.$store.getters.currentTime - this.start
    },
    remaining () {
      return this.end - this.start - this.now
    },
    status () {
      if (this.$store.getters.currentTime >= this.end) {
        return 'Ended'
      }
      if (this.$store.getters.currentTime <= this.start) {
        return 'Scheduled'
      }
      return 'Running'
    }
  }
}
</script>

<style lang="css">
</style>
