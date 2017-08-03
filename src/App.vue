<template>
  <div id="app">
    <section class="oj-hero is-fullheight">
      <div class="oj-head">
        <oj-nav></oj-nav>
      </div>
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
    <oj-sim></oj-sim>
  </div>
</template>

<script>
import Nav from './components/Nav.vue'
import Footer from './components/Footer.vue'
import LoginModal from './components/LoginModal.vue'
import SolutionModal from './components/SolutionModal.vue'
import Notifications from './components/Notifications.vue'
import SimModal from './components/SolutionSimModal.vue'

import { mapActions } from 'vuex'

export default {
  name: 'app',
  components: {
    'oj-nav': Nav,
    'oj-loginmodal': LoginModal,
    'oj-solutionmodal': SolutionModal,
    'oj-notification': Notifications,
    'oj-footer': Footer,
    'oj-sim': SimModal
  },
  methods: {
    ...mapActions([ 'fetchSession', 'updateCurrentTime', 'fetchServerTime' ])
  },
  created () {
    this.fetchSession()
    this.fetchServerTime()
      .then(() => this.updateCurrentTime())
  }
}
</script>

<style lang="scss">
</style>
