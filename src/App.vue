<template>
  <div id="app">
    <oj-nav></oj-nav>
    <br>
    <div class="container">
      <router-view></router-view>
    </div>
    <oj-loginmodal></oj-loginmodal>
  </div>
</template>

<script>

import Nav from './components/Nav.vue'
import LoginModal from './components/LoginModal.vue'

export default {
  name: 'app',
  components: {
    'oj-nav': Nav,
    'oj-loginmodal': LoginModal
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
