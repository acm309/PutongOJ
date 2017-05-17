<template>
  <div id="app">
    <section class="oj-hero is-fullheight">
      <div class="oj-head">
        <oj-nav></oj-nav>
      </div>
      <br>
      <div class="oj-body">
        <div class="container">
          <router-view></router-view>
        </div>
      </div>
      <div class="oj-foot">
        <oj-footer></oj-footer>
      </div>
    </section>
    <oj-loginmodal></oj-loginmodal>
    <oj-solutionmodal v-if="$store.getters.solutionModalActive"></oj-solutionmodal>
    <oj-notification></oj-notification>
  </div>
</template>

<script>

import Nav from './components/Nav.vue'
import Footer from './components/Footer.vue'
import LoginModal from './components/LoginModal.vue'
import SolutionModal from './components/SolutionModal.vue'
import Notifications from './components/Notifications.vue'

export default {
  name: 'app',
  components: {
    'oj-nav': Nav,
    'oj-loginmodal': LoginModal,
    'oj-solutionmodal': SolutionModal,
    'oj-notification': Notifications,
    'oj-footer': Footer
  }
}
</script>

<style lang="scss">
</style>
