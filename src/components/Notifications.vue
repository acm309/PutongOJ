<template lang="html">
  <div class="notifications">
    <transition-group
      enter-active-class="animated bounceInRight"
      leave-active-class="animated bounceOutRight"
    >
      <oj-notification
        v-for="(msg, index) in messages"
        :msg="msg"
        :key="index"
      >
      </oj-notification>
    </transition-group>
  </div>
</template>

<script>

import Notification from './Notification.vue'

export default {
  components: {
    'oj-notification': Notification
  },
  computed: {
    messages () {
      return this.$store.getters.messages
    }
  }
}
</script>

<style lang="css">
</style>
