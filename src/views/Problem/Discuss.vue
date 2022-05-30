<script>
export default {
  mounted () {
    const node = document.createElement('script')
    node.setAttribute('src', '//v2.uyan.cc/code/uyan.js')
    const frame = document.querySelector('.discuss-wrap')
    frame.appendChild(node)
  },
  unmounted () {
    // 友言根据这些变量得知是否已经加载评论
    // 删除这些变量会使友言重新加载
    delete window.UYAN
    delete window.UYAN_L
    delete window.uyan_loadover
    delete window.uyan_loaded
  },
}
</script>

<template>
  <div class="discuss-wrap">
    <div id="uyan_frame" />
  </div>
</template>

<style lang="stylus">
</style>
