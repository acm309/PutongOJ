<template lang="html">
  <span
    v-if="isAdmin && STATUS.Reserve === status"
    class="is-reserved hint--right"
    aria-label="This item is reserved, and no one could see this, except admin"
  >
    <slot>Reserved</slot>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: ['status'],
  computed: {
    ...mapGetters({
      isAdmin: 'isAdmin',
      STATUS: 'status'
    })
  }
}
</script>

<style lang="css">
</style>
