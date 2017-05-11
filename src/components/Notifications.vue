<template lang="html">
  <div class="notifications">
    <oj-notification
      v-for="(msg, index) in messages"
      :msg="msg"
      :key="index"
    >
    </oj-notification>
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
