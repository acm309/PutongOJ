<template lang="html">
  <div>
    <div
      class="notification"
      :class="`is-${msg.type}`"
      v-if="active"
    >
      <button
        class="delete"
        @click="active = false"
      ></button>
      {{ msg.body }}
    </div>
  </div>
</template>

<script>
export default {
  props: ['msg'],
  data () {
    return {
      active: true
    }
  }
}
</script>

<style lang="css">
</style>
