<template lang="html">
  <footer class="footer">
    <div class="container">
      <div class="content has-text-centered">
        <p>Server Time: {{ time | timePretty }}</p>
        <p>
          <strong>PutongOJ</strong>. The source code is licensed
          <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
          <a class="icon" target="_blank" href="https://github.com/lazzzis/PutongOJ">
            <i class="fa fa-github"></i>
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters({ time: 'currentTime' })
  }
}
</script>

<style lang="css">
</style>
