<template>
  <div id="app">
    <oj-nav></oj-nav>
    <br>
    <div class="container">
      <router-view></router-view>
    </div>
    <oj-loginmodal></oj-loginmodal>
    <oj-solutionmodal v-if="$store.getters.solutionModalActive"></oj-solutionmodal>
    <oj-notification></oj-notification>
  </div>
</template>

<script>

import Nav from './components/Nav.vue'
import LoginModal from './components/LoginModal.vue'
import SolutionModal from './components/SolutionModal.vue'
import Notifications from './components/Notifications.vue'

export default {
  name: 'app',
  components: {
    'oj-nav': Nav,
    'oj-loginmodal': LoginModal,
    'oj-solutionmodal': SolutionModal,
    'oj-notification': Notifications
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
