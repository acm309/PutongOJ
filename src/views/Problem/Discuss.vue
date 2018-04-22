<template lang="html">
  <div class="discuss-wrap">
    讨论区
    <remote-js src="http://v2.uyan.cc/code/uyan.js"></remote-js>
    <div id="uyan_frame"></div>
  </div>
</template>

<script>

export default {
  components: {
    'remote-js': {
      render (createElement) {
        return createElement('script', { attrs: { type: 'text/javascript', src: this.src } })
      },
      props: {
        src: { type: String, required: true }
      }
    }
  }
}
</script>

<style lang="stylus">
</style>
