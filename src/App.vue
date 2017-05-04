<template>
  <div id="app">
    <oj-nav></oj-nav>
  </div>
</template>

<script>

import Nav from './components/Nav.vue'

export default {
  name: 'app',
  components: {
    'oj-nav': Nav
  },
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<style lang="scss">
</style>
